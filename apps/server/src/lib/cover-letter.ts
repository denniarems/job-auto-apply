import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { env } from "@job-auto-apply/env/server";
import type { ResumeData } from "./extraction";

// Provider type
export type AIProvider = "anthropic" | "google" | "openai";

// Create OpenAI client with optional API key
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

// Map provider to model
function getModel(provider: AIProvider) {
  switch (provider) {
    case "anthropic":
      return anthropic("claude-3-5-sonnet-20241022");
    case "google":
      return google("gemini-2.0-flash-exp");
    case "openai":
      return openai("gpt-4o");
  }
}

// Cover letter generation function
export async function generateCoverLetter(
  provider: AIProvider,
  jobDescription: string,
  resumeData: ResumeData,
  companyName: string,
  position: string
): Promise<string> {
  const model = getModel(provider);

  const { text } = await generateText({
    model,
    prompt: `Generate a concise cover letter (~150-250 words) for the following position.
    
Company: ${companyName}
Position: ${position}

Job Description:
${jobDescription}

Candidate Resume:
- Name: ${resumeData.fullName || "Not provided"}
- Summary: ${resumeData.summary || "Not provided"}
- Skills: ${resumeData.skills?.join(", ") || "Not provided"}
- Experience: ${resumeData.workExperience?.map((e) => `${e.title} at ${e.company}`).join("; ") || "Not provided"}
- Education: ${resumeData.education?.map((e) => `${e.degree} in ${e.field} at ${e.institution}`).join("; ") || "Not provided"}

Requirements:
- Standard business format with greeting, intro, body, closing, signature
- Summarize key points from job description (don't repeat full JD)
- Highlight relevant experience from resume
- Dynamic closing based on company culture
- Keep it concise (1-2 paragraphs, ~150-250 words total)

Write the complete cover letter text.`,
  });

  return text;
}
