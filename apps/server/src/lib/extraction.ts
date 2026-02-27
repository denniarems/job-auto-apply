import { generateObject } from "ai";
import { z } from "zod";
import { env } from "@job-auto-apply/env/server";
import { type AIProvider, getModel } from "./ai-providers";

// Resume data extraction schema
export const resumeDataSchema = z.object({
  fullName: z.string().optional().describe("Full name of the person"),
  email: z.string().optional().describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  location: z.string().optional().describe("City, State/Country"),
  summary: z.string().optional().describe("Professional summary or objective"),
  workExperience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        current: z.boolean().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .describe("Work experience entries"),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string().optional(),
        graduationDate: z.string().optional(),
        gpa: z.string().optional(),
      })
    )
    .optional()
    .describe("Education entries"),
  skills: z
    .array(z.string())
    .optional()
    .describe("List of technical and soft skills"),
  certifications: z
    .array(z.string())
    .optional()
    .describe("Professional certifications"),
  languages: z
    .array(z.string())
    .optional()
    .describe("Languages spoken with proficiency level"),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        url: z.string().optional(),
      })
    )
    .optional()
    .describe("Notable projects"),
  links: z
    .array(z.string())
    .optional()
    .describe("LinkedIn, GitHub, portfolio URLs"),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

// Confidence indicator type
export type ConfidenceLevel = "high" | "medium" | "low";

export interface FieldConfidence {
  field: string;
  confidence: ConfidenceLevel;
  originalValue: string;
}

export interface ExtractionResult {
  data: ResumeData;
  confidences: FieldConfidence[];
  rawText: string;
}

// Re-export AIProvider for consumers that previously imported it from here
export type { AIProvider };

// Extract resume data from raw text using AI
export async function extractResumeData(
  rawText: string,
  provider: AIProvider = "anthropic"
): Promise<ExtractionResult> {
  const model = getModel(provider);

  const { object } = await generateObject({
    model,
    schema: resumeDataSchema,
    prompt: `Extract structured resume data from the following text. Be thorough and extract as many fields as possible. If a field is not present, leave it as undefined/null.

Resume Text:
${rawText}`,
  });

  // Calculate confidence based on presence of key fields
  const confidences = calculateConfidences(object);

  return {
    data: object,
    confidences,
    rawText,
  };
}

function calculateConfidences(data: ResumeData): FieldConfidence[] {
  const fields: FieldConfidence[] = [];

  // Helper to add confidence for a field
  const addConfidence = (field: string, value: unknown) => {
    let confidence: ConfidenceLevel;
    if (Array.isArray(value)) {
      confidence = value.length > 0 ? "high" : "low";
    } else if (value && typeof value === "object") {
      confidence = Object.keys(value as object).length > 0 ? "high" : "low";
    } else {
      confidence = value ? "high" : "low";
    }
    fields.push({
      field,
      confidence,
      originalValue: JSON.stringify(value),
    });
  };

  addConfidence("fullName", data.fullName);
  addConfidence("email", data.email);
  addConfidence("phone", data.phone);
  addConfidence("location", data.location);
  addConfidence("summary", data.summary);
  addConfidence("workExperience", data.workExperience);
  addConfidence("education", data.education);
  addConfidence("skills", data.skills);
  addConfidence("certifications", data.certifications);
  addConfidence("languages", data.languages);
  addConfidence("projects", data.projects);
  addConfidence("links", data.links);

  return fields;
}

// Get provider display name
export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case "anthropic":
      return "Claude";
    case "google":
      return "Gemini";
    case "openai":
      return "OpenAI";
    case "qwen":
      return "Qwen";
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown AI provider: ${_exhaustive}`);
    }
  }
}

// Check if provider has API key
export function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case "anthropic":
      return !!env.ANTHROPIC_API_KEY;
    case "google":
      return !!env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "openai":
      return !!env.OPENAI_API_KEY;
    case "qwen":
      return !!env.QWEN_API_KEY;
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown AI provider: ${_exhaustive}`);
    }
  }
}
