import { Hono } from "hono";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { FormData, DetectionResult, DetectedField } from "../types/forms";
import { detectATS } from "../lib/ats-detector";
import { filterHoneypotFields } from "../lib/honeypot";

const router = new Hono();

// Lightweight model for form detection (per user decision)
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory cache for form detection results (5 minutes TTL)
const detectionCache = new Map<
  string,
  { result: DetectionResult[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract cache key from form data and URL
 */
function getCacheKey(url: string, forms: FormData[]): string {
  // Use URL and field count as cache key
  return `${url}:${forms.length}`;
}

/**
 * Check if cached result exists and is still valid
 */
function getCachedResult(
  url: string,
  forms: FormData[],
): DetectionResult[] | null {
  const key = getCacheKey(url, forms);
  const cached = detectionCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  return null;
}

/**
 * Cache detection result
 */
function cacheResult(url: string, forms: FormData[], result: DetectionResult[]): void {
  const key = getCacheKey(url, forms);
  detectionCache.set(key, { result, timestamp: Date.now() });

  // Cleanup old entries if cache is too large
  if (detectionCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of detectionCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        detectionCache.delete(k);
      }
    }
  }
}

/**
 * Detect if a form is a job application form using AI
 */
async function detectJobApplication(
  form: FormData,
  url: string,
): Promise<DetectionResult> {
  const fields = form.fields;

  // Build field summary for the AI
  const fieldSummary = fields
    .map(
      (f) =>
        `- ${f.type} input[name="${f.name}" id="${f.id}" label="${f.label}" placeholder="${f.placeholder}" required=${f.required} autocomplete="${f.autocomplete}"`,
    )
    .join("\n");

  const prompt = `Analyze the following form fields from URL: ${url}

Form fields:
${fieldSummary}

Determine if this is a JOB APPLICATION FORM (not a contact form, newsletter signup, or other type of form).

Look for common job application fields:
- Personal info: first name, last name, full name
- Contact: email, phone, address
- Experience: work history, company names, job titles, dates
- Education: schools, degrees, graduation dates
- Resume/CV upload
- Cover letter
- LinkedIn profile URL
- Portfolio/website
- Expected salary
- Availability start date
- Authorization to work

Respond with a JSON object containing:
{
  "isJobApplication": true/false,
  "confidence": 0.0-1.0 (how confident you are this is a job application form),
  "detectedFields": [
    {
      "category": "personal|contact|experience|education|salary|skills|other",
      "semanticName": "human readable name for this field",
      "inputName": "the form input name",
      "keywords": ["relevant", "keywords"]
    }
  ]
}

Only return isJobApplication=true if confidence > 0.8 (conservative threshold).`;

  try {
    const { text } = await generateText({
      model: openai("claude-3-haiku-20240307"),
      prompt,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Detect ATS type
      const atsType = detectATS(url, form);

      return {
        isJobApplication: parsed.isJobApplication ?? false,
        confidence: parsed.confidence ?? 0,
        atsType,
        detectedFields: parsed.detectedFields ?? [],
      };
    }
  } catch (error) {
    console.error("[forms/detect] AI detection error:", error);
  }

  // Fallback: basic detection based on field names
  const basicDetection = basicJobFormDetection(fields);
  const atsType = detectATS(url, form);

  return {
    ...basicDetection,
    atsType,
  };
}

/**
 * Basic fallback detection using field name patterns
 */
function basicJobFormDetection(
  fields: FormData["fields"],
): Omit<DetectionResult, "atsType"> {
  const jobFieldPatterns = [
    /first[_-]?name/i,
    /last[_-]?name/i,
    /full[_-]?name/i,
    /email/i,
    /phone/i,
    /resume/i,
    /cv/i,
    /cover[_-]?letter/i,
    /experience/i,
    /education/i,
    /degree/i,
    /school/i,
    /company/i,
    /employer/i,
    /job[_-]?title/i,
    /position/i,
    /salary/i,
    /expected/i,
    /availability/i,
    /linkedin/i,
    /portfolio/i,
    /website/i,
    /work[_-]?history/i,
  ];

  let matchCount = 0;
  const detectedFields: DetectedField[] = [];

  for (const field of fields) {
    const searchText = `${field.name} ${field.label} ${field.placeholder}`.toLowerCase();

    for (const pattern of jobFieldPatterns) {
      if (pattern.test(searchText)) {
        matchCount++;
        detectedFields.push({
          category: categorizeField(field.name, field.label),
          semanticName: field.label || field.name,
          inputName: field.name,
          memoryQuestion: generateMemoryQuestion(field),
          keywords: [pattern.source],
        });
        break;
      }
    }
  }

  const confidence = Math.min(matchCount / 5, 1); // Need at least 5 fields for high confidence

  return {
    isJobApplication: confidence > 0.5,
    confidence,
    detectedFields: confidence > 0 ? detectedFields : [],
  };
}

/**
 * Categorize a field based on its name and label
 */
function categorizeField(name: string, label: string): DetectedField["category"] {
  const text = `${name} ${label}`.toLowerCase();

  if (text.match(/first|last|full|name/)) return "personal";
  if (text.match(/email|phone|address|mobile/)) return "contact";
  if (text.match(/experience|work|company|employer|job|title|position/)) return "experience";
  if (text.match(/education|school|degree|university|college|grad/)) return "education";
  if (text.match(/salary|wage|compensation|expected|pay/)) return "salary";
  if (text.match(/skill|certif|language|ability/)) return "skills";

  return "other";
}

/**
 * Generate a memory question for field-to-memory matching
 */
function generateMemoryQuestion(field: FormData["fields"][0]): string {
  const label = field.label || field.name || field.placeholder || "";

  // Convert field label to a question
  if (label.match(/name/i)) {
    if (label.match(/first/i)) return "What is your first name?";
    if (label.match(/last/i)) return "What is your last name?";
    return "What is your full name?";
  }
  if (label.match(/email/i)) return "What is your email address?";
  if (label.match(/phone|mobile|cell/i)) return "What is your phone number?";
  if (label.match(/address/i)) return "What is your address?";
  if (label.match(/city/i)) return "What city do you live in?";
  if (label.match(/state/i)) return "What state do you live in?";
  if (label.match(/zip|postal/i)) return "What is your zip code?";
  if (label.match(/country/i)) return "What country are you in?";
  if (label.match(/company|employer/i)) return "What company do you work for?";
  if (label.match(/title|position|role/i)) return "What is your job title?";
  if (label.match(/experience|work.*history/i)) return "Describe your work experience";
  if (label.match(/education|school|university|college/i)) return "What is your education background?";
  if (label.match(/degree/i)) return "What degree do you have?";
  if (label.match(/skill/i)) return "What are your skills?";
  if (label.match(/salary|expected|pay|compensation/i)) return "What is your expected salary?";
  if (label.match(/linkedin/i)) return "What is your LinkedIn profile URL?";
  if (label.match(/website|portfolio|personal/i)) return "What is your website or portfolio URL?";
  if (label.match(/resume|cv/i)) return "Upload your resume";
  if (label.match(/cover.*letter/i)) return "What is your cover letter?";

  // Default: use the label as the question
  return label ? `What is your ${label.toLowerCase()}?` : "Provide this information";
}

// POST /api/forms/detect
router.post("/detect", async (c) => {
  const body = await c.req.json();
  const { forms, url } = body as { forms: FormData[]; url: string };

  if (!forms || !Array.isArray(forms) || forms.length === 0) {
    return c.json({ error: "forms array is required" }, 400);
  }

  if (!url) {
    return c.json({ error: "url is required" }, 400);
  }

  // Check cache first
  const cached = getCachedResult(url, forms);
  if (cached) {
    return c.json({ results: cached });
  }

  // Detect job application forms
  const results: DetectionResult[] = [];

  for (const form of forms) {
    // Filter out honeypot fields first
    const filteredFields = filterHoneypotFields(form.fields, url);

    const formData: FormData = {
      ...form,
      fields: filteredFields,
    };

    const detection = await detectJobApplication(formData, url);

    // Apply conservative threshold (confidence > 0.8)
    if (detection.confidence <= 0.8) {
      detection.isJobApplication = false;
    }

    results.push(detection);
  }

  // Cache results
  cacheResult(url, forms, results);

  return c.json({ results });
});

export default router;
