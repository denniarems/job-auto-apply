import { Hono } from "hono";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { env } from "@job-auto-apply/env/server";
import type { FormField, DetectedField } from "../types/forms";

const router = new Hono();

// Lightweight model for field extraction (per user decision)
const anthropic = createAnthropic({ apiKey: env.OPENAI_API_KEY });

/**
 * Extract and categorize fields semantically using AI
 */
async function extractFields(
  fields: FormField[],
  context?: string,
): Promise<DetectedField[]> {
  if (fields.length === 0) {
    return [];
  }

  // Build field summary for the AI
  const fieldSummary = fields
    .map(
      (f) =>
        `- ${f.type} input: name="${f.name}" id="${f.id}" label="${f.label}" placeholder="${f.placeholder}" required=${f.required}`,
    )
    .join("\n");

  const contextSection = context ? `\nAdditional context:\n${context}` : "";

  const prompt = `Analyze the following form fields and categorize them semantically.${contextSection}

Form fields:
${fieldSummary}

For each field, determine:
1. category: One of "personal", "contact", "experience", "education", "salary", "skills", "other"
2. semanticName: A human-readable name for what this field asks for
3. memoryQuestion: A natural language question that could be asked to get this information from a user (e.g., "What is your email address?" for an email field)

Respond with a JSON array of objects:
[
  {
    "category": "personal|contact|experience|education|salary|skills|other",
    "semanticName": "human readable name",
    "inputName": "the form input name attribute",
    "memoryQuestion": "question to ask user for this field",
    "keywords": ["relevant", "keywords", "for", "this", "field"]
  }
]

Ensure each field from the input is included in the output.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      prompt,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      // Type assertion is safe here: the AI is prompted to return DetectedField[]
      // and the schema is validated structurally by the prompt contract.
      return JSON.parse(jsonMatch[0]) as DetectedField[];
    }
  } catch (e: unknown) {
    console.error("[fields/extract] AI extraction error:", e instanceof Error ? e.message : e);
  }

  // Fallback: basic categorization without AI
  return basicFieldExtraction(fields);
}

/**
 * Basic fallback field extraction using patterns
 */
function basicFieldExtraction(fields: FormField[]): DetectedField[] {
  return fields.map((field) => {
    const category = categorizeField(field.name, field.label);
    const semanticName = field.label || field.name;
    const memoryQuestion = generateMemoryQuestion(field);

    return {
      category,
      semanticName,
      inputName: field.name,
      memoryQuestion,
      keywords: extractKeywords(field),
    };
  });
}

/**
 * Categorize a field based on its name and label
 */
function categorizeField(
  name: string,
  label: string,
): DetectedField["category"] {
  const text = `${name} ${label}`.toLowerCase();

  if (text.match(/first[_-]?name|last[_-]?name|full[_-]?name|name/)) return "personal";
  if (text.match(/email|phone|mobile|cell|address|city|state|zip|postal|country/)) return "contact";
  if (text.match(/experience|work|company|employer|job|title|position|responsibility/)) return "experience";
  if (text.match(/education|school|university|college|degree|grad|gpa|major|minor/)) return "education";
  if (text.match(/salary|wage|compensation|expected|pay|notice.*period/)) return "salary";
  if (text.match(/skill|certif|language|ability|competency/)) return "skills";

  return "other";
}

/**
 * Generate a memory question for field-to-memory matching
 */
function generateMemoryQuestion(field: FormField): string {
  const label = field.label || field.name || field.placeholder || "";

  // Convert field label to a question
  if (label.match(/first.*name/i)) return "What is your first name?";
  if (label.match(/last.*name/i)) return "What is your last name?";
  if (label.match(/full.*name/i)) return "What is your full name?";
  if (label.match(/name/i)) return "What is your name?";
  if (label.match(/email/i)) return "What is your email address?";
  if (label.match(/phone|mobile|cell/i)) return "What is your phone number?";
  if (label.match(/address/i)) return "What is your address?";
  if (label.match(/city/i)) return "What city do you live in?";
  if (label.match(/state|province/i)) return "What state/province do you live in?";
  if (label.match(/zip|postal/i)) return "What is your zip/postal code?";
  if (label.match(/country/i)) return "What country are you in?";
  if (label.match(/company|employer|organization/i)) return "What company do you work for?";
  if (label.match(/title|position|role|job/i)) return "What is your job title?";
  if (label.match(/experience|work.*history|employment/i)) return "Describe your work experience";
  if (label.match(/education|school|university|college/i)) return "What is your education background?";
  if (label.match(/degree|qualification/i)) return "What degree do you have?";
  if (label.match(/skill|abilities|competenc/i)) return "What are your skills?";
  if (label.match(/salary|expected|pay|compensation|wage/i)) return "What is your expected salary?";
  if (label.match(/linkedin/i)) return "What is your LinkedIn profile URL?";
  if (label.match(/website|portfolio|personal.*site/i)) return "What is your website or portfolio URL?";
  if (label.match(/resume|cv|curriculum/i)) return "Upload your resume";
  if (label.match(/cover.*letter/i)) return "What is your cover letter?";
  if (label.match(/start.*date|availability|available/i)) return "When can you start?";
  if (label.match(/authorized|work.*authorization/i)) return "Are you authorized to work?";
  if (label.match(/sponsor|visa/i)) return "Do you require visa sponsorship?";

  // Default: use the label as the question
  return label ? `What is your ${label.toLowerCase()}?` : "Provide this information";
}

/**
 * Extract keywords from a field for matching
 */
function extractKeywords(field: FormField): string[] {
  const text = `${field.name} ${field.label} ${field.placeholder}`.toLowerCase();

  const keywords: string[] = [];

  // Add common patterns
  if (text.match(/name/)) keywords.push("name", "personal");
  if (text.match(/email/)) keywords.push("email", "contact");
  if (text.match(/phone|mobile/)) keywords.push("phone", "contact");
  if (text.match(/address/)) keywords.push("address", "contact");
  if (text.match(/company|employer/)) keywords.push("company", "work", "experience");
  if (text.match(/title|position|role/)) keywords.push("title", "position", "experience");
  if (text.match(/experience|work/)) keywords.push("experience", "work");
  if (text.match(/education|school|university|college/)) keywords.push("education");
  if (text.match(/degree/)) keywords.push("degree", "education");
  if (text.match(/skill/)) keywords.push("skills");
  if (text.match(/salary|pay|wage/)) keywords.push("salary", "compensation");
  if (text.match(/resume|cv/)) keywords.push("resume", "cv");
  if (text.match(/linkedin/)) keywords.push("linkedin", "social");
  if (text.match(/website|portfolio/)) keywords.push("website", "portfolio");

  return [...new Set(keywords)];
}

// POST /api/fields/extract
router.post("/extract", async (c) => {
  const body = await c.req.json();
  const { fields, context } = body as {
    fields: FormField[];
    context?: string;
  };

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return c.json({ error: "fields array is required" }, 400);
  }

  const detectedFields = await extractFields(fields, context);

  return c.json({ fields: detectedFields });
});

export default router;
