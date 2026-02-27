import { generateText } from "ai";
import { type AIProvider, getModel } from "./ai-providers";
import type { ResumeData } from "./extraction";

// Re-export AIProvider for consumers that previously imported it from here
export type { AIProvider };

// Cover letter generation function
export async function generateCoverLetter(
  provider: AIProvider,
  jobDescription: string,
  resumeData: ResumeData,
  companyName: string,
  position: string
): Promise<string> {
  const model = getModel(provider);

  try {
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Cover letter generation failed using provider "${provider}": ${message}`
    );
  }
}
