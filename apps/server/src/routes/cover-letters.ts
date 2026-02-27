import { Hono } from "hono";
import { coverLettersTable } from "../db/lancedb";
import { generateCoverLetter, type AIProvider } from "../lib/cover-letter";
import { generateCoverLetterPDF } from "../lib/pdf-generator";
import { memoriesTable } from "../db/lancedb";
import { v4 as uuidv4 } from "uuid";
import type { ResumeData } from "../lib/extraction";

const router = new Hono();

// Sanitize user-supplied IDs to prevent SQL injection in LanceDB where clauses.
// Only allow alphanumeric characters and hyphens (UUID format).
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
}

// Parse cover letter text into sections
function parseCoverLetterContent(text: string): {
  greeting: string;
  intro: string;
  body: string;
  closing: string;
  signature: string;
} {
  const sections = text.split(/\n\n+/);

  // Default values
  let greeting = "Dear Hiring Manager,";
  let intro = "";
  let body = "";
  let closing = "";
  let signature = "Sincerely,";

  if (sections.length >= 1) greeting = sections[0] || "";
  if (sections.length >= 2) intro = sections[1] || "";
  if (sections.length >= 3) {
    // body is everything between intro and closing
    if (sections.length <= 3) {
      body = sections.slice(1, sections.length - 1).join("\n\n");
    } else {
      body = sections.slice(2, -1).join("\n\n");
    }
  }
  if (sections.length >= 4) closing = sections[sections.length - 1] || "";

  // Try to extract signature from closing (often has a name after "Sincerely," or "Best regards,")
  const closingLines = closing.split("\n");
  if (closingLines.length > 1) {
    signature = closingLines[0] || "Sincerely,";
    closing = closingLines.slice(1).join("\n");
  }

  return { greeting, intro, body, closing, signature };
}

// Memory record shape returned by LanceDB
interface MemoryRecord {
  id: string;
  question: string;
  answer: string;
  category: string;
  source: string;
}

// Get resume data from memories stored during resume approval.
// Memories created from a resume upload are tagged with source = 'resume'.
async function getResumeData(): Promise<ResumeData> {
  const memories = await memoriesTable.query().limit(100).toArray();

  // Collect all memories that originated from a resume upload
  const resumeMemories = memories.filter(
    (m: MemoryRecord) => m.source === "resume" && m.id !== "__init__"
  );

  if (resumeMemories.length === 0) {
    return buildDefaultResumeData();
  }

  // Reconstruct ResumeData from individual memory Q&A entries
  const data: ResumeData = buildDefaultResumeData();

  for (const mem of resumeMemories as MemoryRecord[]) {
    const answer = mem.answer;
    switch (mem.category) {
      case "personal":
        if (!data.fullName || data.fullName === "Your Name") {
          data.fullName = answer;
        }
        break;
      case "contact":
        if (mem.question.toLowerCase().includes("email")) {
          data.email = answer;
        } else if (mem.question.toLowerCase().includes("phone")) {
          data.phone = answer;
        } else if (
          mem.question.toLowerCase().includes("locat") ||
          mem.question.toLowerCase().includes("where")
        ) {
          data.location = answer;
        }
        break;
      case "summary":
        data.summary = answer;
        break;
      case "skills":
        data.skills = answer.split(",").map((s) => s.trim());
        break;
      case "certifications":
        data.certifications = answer.split(",").map((s) => s.trim());
        break;
      case "languages":
        data.languages = answer.split(",").map((s) => s.trim());
        break;
      default:
        break;
    }
  }

  return data;
}

function buildDefaultResumeData(): ResumeData {
  return {
    fullName: "Your Name",
    email: "your.email@example.com",
    phone: "",
    location: "",
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
  };
}

// POST /generate - Generate cover letter text
router.post("/generate", async (c) => {
  const { jobDescription, companyName, position, provider, applicationId } =
    await c.req.json();

  if (!jobDescription || !companyName || !position) {
    return c.json(
      {
        error: "jobDescription, companyName, and position are required",
      },
      400
    );
  }

  // Get resume data from memories
  const resumeData = await getResumeData();

  // Default to anthropic if not specified
  const aiProvider: AIProvider = (provider as AIProvider) || "anthropic";

  try {
    const content = await generateCoverLetter(
      aiProvider,
      jobDescription,
      resumeData,
      companyName,
      position
    );

    // Save to cover_letters table
    const now = Date.now();
    const id = uuidv4();

    await coverLettersTable.add([
      {
        id,
        application_id: applicationId || "",
        company: companyName,
        position: position,
        content,
        generated_at: BigInt(now),
      },
    ]);

    return c.json({ success: true, id, content }, 201);
  } catch (error: unknown) {
    console.error("Cover letter generation error:", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate cover letter",
      },
      500
    );
  }
});

// POST /download - Generate PDF and stream to client
router.post("/download", async (c) => {
  const {
    content,
    company,
    position,
    candidateName,
    candidateEmail,
    candidatePhone,
    candidateLocation,
  } = await c.req.json();

  if (!content || !company || !position) {
    return c.json(
      { error: "content, company, and position are required" },
      400
    );
  }

  try {
    // Parse content into sections
    const parsedContent = parseCoverLetterContent(content);

    // Use provided candidate info or get from resume
    let candidate = { name: "Your Name", email: "", phone: "", location: "" };

    if (candidateName) {
      candidate = {
        name: candidateName,
        email: candidateEmail || "",
        phone: candidatePhone || "",
        location: candidateLocation || "",
      };
    } else {
      // Try to get from resume memories
      const resumeData = await getResumeData();
      candidate = {
        name: resumeData.fullName || "Your Name",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        location: resumeData.location || "",
      };
    }

    // Generate PDF
    const pdfBuffer = await generateCoverLetterPDF({
      content: parsedContent,
      candidate,
      company,
      position,
    });

    // Format date for filename
    const date = new Date().toISOString().split("T")[0];
    const filename = `CoverLetter_${company.replace(/[^a-zA-Z0-9]/g, "_")}_${position.replace(/[^a-zA-Z0-9]/g, "_")}_${date}.pdf`;

    // Return PDF with appropriate headers
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      500
    );
  }
});

// GET /history - List saved cover letters
router.get("/history", async (c) => {
  const results = await coverLettersTable.query().limit(100).toArray();

  // Filter out __init__ placeholder and sort by date desc
  // LanceDB does not expose a stable cross-version .orderBy() API, so we sort in JS.
  const coverLetters = results
    .filter((r: MemoryRecord) => r.id !== "__init__")
    .sort(
      (
        a: Record<string, unknown>,
        b: Record<string, unknown>
      ) => Number(b.generated_at) - Number(a.generated_at)
    )
    .map((r: Record<string, unknown>) => ({
      id: r.id,
      application_id: r.application_id,
      company: r.company,
      position: r.position,
      content: r.content,
      generated_at: Number(r.generated_at),
    }));

  return c.json(coverLetters);
});

// GET /:id - Get single cover letter
router.get("/:id", async (c) => {
  const id = sanitizeId(c.req.param("id"));
  const results = await coverLettersTable
    .query()
    .where(`id = '${id}'`)
    .toArray();

  if (results.length === 0 || results[0].id === "__init__") {
    return c.json({ error: "Cover letter not found" }, 404);
  }

  const coverLetter = results[0];
  return c.json({
    id: coverLetter.id,
    application_id: coverLetter.application_id,
    company: coverLetter.company,
    position: coverLetter.position,
    content: coverLetter.content,
    generated_at: Number(coverLetter.generated_at),
  });
});

// DELETE /:id - Delete cover letter
router.delete("/:id", async (c) => {
  const id = sanitizeId(c.req.param("id"));

  const existing = await coverLettersTable
    .query()
    .where(`id = '${id}'`)
    .toArray();

  if (existing.length === 0 || existing[0].id === "__init__") {
    return c.json({ error: "Cover letter not found" }, 404);
  }

  await coverLettersTable.delete(`id = '${id}'`);
  return c.json({ success: true });
});

export default router;
