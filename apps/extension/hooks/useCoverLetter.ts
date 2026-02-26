import { useState, useCallback } from "react";

export interface ResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  workExperience?: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationDate?: string;
  }>;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  links?: string[];
}

export interface CoverLetterHistoryItem {
  id: string;
  companyName: string;
  position: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useCoverLetter(backendUrl: string, provider: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    jobDescription: string,
    resumeData: ResumeData,
    company: string,
    position: string
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/cover-letters/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resumeData,
          companyName: company,
          position,
          provider
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Generation failed");
      }
      const data = await res.json();
      return data.content;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [backendUrl, provider]);

  const download = useCallback(async (
    content: string,
    company: string,
    position: string
  ): Promise<void> => {
    setIsDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/cover-letters/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, company, position }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CoverLetter_${company.replace(/[^a-zA-Z0-9]/g, "_")}_${position.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF generation failed";
      setError(message);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  }, [backendUrl]);

  const getHistory = useCallback(async (): Promise<CoverLetterHistoryItem[]> => {
    try {
      const res = await fetch(`${backendUrl}/api/cover-letters/history`);
      if (!res.ok) {
        throw new Error("Failed to fetch history");
      }
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.error("Failed to fetch cover letter history:", err);
      return [];
    }
  }, [backendUrl]);

  const deleteCoverLetter = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`${backendUrl}/api/cover-letters/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete cover letter");
    }
  }, [backendUrl]);

  return {
    generate,
    download,
    getHistory,
    deleteCoverLetter,
    isGenerating,
    isDownloading,
    error,
    clearError: () => setError(null),
  };
}
