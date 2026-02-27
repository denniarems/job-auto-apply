import { z } from "zod";
import type { ResumeData } from "./extraction";

// Schema for generated questions
export const fieldQuestionSchema = z.object({
  field: z.string(),
  category: z.enum([
    "personal",
    "contact",
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "languages",
    "projects",
    "links",
  ]),
  question: z.string(),
  value: z.string().optional(),
});

export type FieldQuestion = z.infer<typeof fieldQuestionSchema>;

// Generate questions for all extracted fields
export function generateFieldQuestions(resumeData: ResumeData): FieldQuestion[] {
  const questions: FieldQuestion[] = [];

  // Personal information
  if (resumeData.fullName) {
    questions.push({
      field: "fullName",
      category: "personal",
      question: "What is the candidate's full name?",
      value: resumeData.fullName,
    });
  }

  // Contact information
  if (resumeData.email) {
    questions.push({
      field: "email",
      category: "contact",
      question: "What is the candidate's email address?",
      value: resumeData.email,
    });
  }

  if (resumeData.phone) {
    questions.push({
      field: "phone",
      category: "contact",
      question: "What is the candidate's phone number?",
      value: resumeData.phone,
    });
  }

  if (resumeData.location) {
    questions.push({
      field: "location",
      category: "contact",
      question: "Where is the candidate located?",
      value: resumeData.location,
    });
  }

  // Summary
  if (resumeData.summary) {
    questions.push({
      field: "summary",
      category: "summary",
      question: "What is the candidate's professional summary?",
      value: resumeData.summary,
    });
  }

  // Work Experience
  if (resumeData.workExperience?.length) {
    resumeData.workExperience.forEach((exp, index) => {
      questions.push({
        field: `workExperience.${index}.company`,
        category: "experience",
        question: `Where did the candidate work (position ${index + 1})?`,
        value: exp.company,
      });

      questions.push({
        field: `workExperience.${index}.title`,
        category: "experience",
        question: `What was the candidate's job title (position ${index + 1})?`,
        value: exp.title,
      });

      if (exp.description) {
        questions.push({
          field: `workExperience.${index}.description`,
          category: "experience",
          question: `What were the candidate's responsibilities (position ${index + 1})?`,
          value: exp.description,
        });
      }
    });
  }

  // Education
  if (resumeData.education?.length) {
    resumeData.education.forEach((edu, index) => {
      questions.push({
        field: `education.${index}.institution`,
        category: "education",
        question: `Where did the candidate study (education ${index + 1})?`,
        value: edu.institution,
      });

      questions.push({
        field: `education.${index}.degree`,
        category: "education",
        question: `What degree did the candidate obtain?`,
        value: edu.degree,
      });

      if (edu.field) {
        questions.push({
          field: `education.${index}.field`,
          category: "education",
          question: `What field of study did the candidate pursue?`,
          value: edu.field,
        });
      }
    });
  }

  // Skills
  if (resumeData.skills?.length) {
    questions.push({
      field: "skills",
      category: "skills",
      question: "What are the candidate's technical and soft skills?",
      value: resumeData.skills.join(", "),
    });
  }

  // Certifications
  if (resumeData.certifications?.length) {
    questions.push({
      field: "certifications",
      category: "certifications",
      question: "What certifications does the candidate have?",
      value: resumeData.certifications.join(", "),
    });
  }

  // Languages
  if (resumeData.languages?.length) {
    questions.push({
      field: "languages",
      category: "languages",
      question: "What languages does the candidate speak?",
      value: resumeData.languages.join(", "),
    });
  }

  // Projects
  if (resumeData.projects?.length) {
    resumeData.projects.forEach((proj, index) => {
      questions.push({
        field: `projects.${index}.name`,
        category: "projects",
        question: `What is the name of project ${index + 1}?`,
        value: proj.name,
      });

      if (proj.description) {
        questions.push({
          field: `projects.${index}.description`,
          category: "projects",
          question: `Describe project ${index + 1}`,
          value: proj.description,
        });
      }

      if (proj.technologies?.length) {
        questions.push({
          field: `projects.${index}.technologies`,
          category: "projects",
          question: `What technologies were used in project ${index + 1}?`,
          value: proj.technologies.join(", "),
        });
      }
    });
  }

  // Links
  if (resumeData.links?.length) {
    questions.push({
      field: "links",
      category: "links",
      question: "What professional links does the candidate have?",
      value: resumeData.links.join(", "),
    });
  }

  return questions;
}

// Convert field question to memory format
export interface MemoryQuestion {
  question: string;
  answer: string;
  category: string;
}

export function toMemoryQuestions(
  questions: FieldQuestion[]
): MemoryQuestion[] {
  return questions
    .filter((q) => q.value)
    .map((q) => ({
      question: q.question,
      answer: q.value as string,
      category: q.category,
    }));
}
