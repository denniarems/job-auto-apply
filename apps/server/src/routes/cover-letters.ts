import { Hono } from "hono";
import { coverLettersTable } from "../db/lancedb";
import { generateCoverLetter, type AIProvider } from "../lib/cover-letter";
import { generateCoverLetterPDF } from "../lib/pdf-generator";
import { memoriesTable } from "../db/lancedb";
import { v4 as uuidv4 } from "uuid";
import type { ResumeData } from "../lib/extraction";

const router = new Hono();

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
  if (sections.length >= 3) body = sections.slice(2, -1).join("\n\n");
  if (sections.length >= 4) closing = sections[sections.length - 1] || "";
  
  // Try to extract signature from closing (often has a name after "Sincerely," or "Best regards,")
  const closingLines = closing.split("\n");
  if (closingLines.length > 1) {
    signature = closingLines[0] || "Sincerely,";
    closing = closingLines.slice(1).join("\n");
  }
  
  return { greeting, intro, body, closing, signature };
}

// Get resume data from memories
async function getResumeData(): Promise<ResumeData> {
  const memories = await memoriesTable.query().limit(100).toArray();
  
  // Look for resume data in memories
  const resumeMemory = memories.find((m: any) => m.category === "resume" && m.id !== "__init__");
  
  if (resumeMemory && resumeMemory.answer) {
    try {
      return JSON.parse(resumeMemory.answer);
    } catch {
      // Return default if parse fails
    }
  }
  
  // Return default/empty resume data
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
  const { jobDescription, companyName, position, provider, applicationId } = await c.req.json();

  if (!jobDescription || !companyName || !position) {
    return c.json({ error: "jobDescription, companyName, and position are required" }, 400);
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
  } catch (error: any) {
    console.error("Cover letter generation error:", error);
    return c.json({ error: error.message || "Failed to generate cover letter" }, 500);
  }
});

// POST /download - Generate PDF and stream to client
router.post("/download", async (c) => {
  const { content, company, position, candidateName, candidateEmail, candidatePhone, candidateLocation } = await c.req.json();

  if (!content || !company || !position) {
    return c.json({ error: "content, company, and position are required" }, 400);
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
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return c.json({ error: error.message || "Failed to generate PDF" }, 500);
  }
});

// GET /history - List saved cover letters
router.get("/history", async (c) => {
  const results = await coverLettersTable.query().limit(100).toArray();

  // Filter out __init__ placeholder and sort by date desc
  const coverLetters = results
    .filter((r: any) => r.id !== "__init__")
    .sort((a: any, b: any) => Number(b.generated_at) - Number(a.generated_at))
    .map((r: any) => ({
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
  const id = c.req.param("id");
  const results = await coverLettersTable.query().where(`id = '${id}'`).toArray();

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
  const id = c.req.param("id");

  const existing = await coverLettersTable.query().where(`id = '${id}'`).toArray();

  if (existing.length === 0 || existing[0].id === "__init__") {
    return c.json({ error: "Cover letter not found" }, 404);
  }

  await coverLettersTable.delete(`id = '${id}'`);
  return c.json({ success: true });
});

export default router;
