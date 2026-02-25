import { Hono } from "hono";
import { parsePdf } from "../lib/pdf";
import { extractResumeData, type AIProvider } from "../lib/extraction";
import { generateFieldQuestions, toMemoryQuestions } from "../lib/questions";
import { initDb, memoriesTable } from "../db/lancedb";
import { generateEmbedding } from "../lib/ai";
import { v4 as uuidv4 } from "uuid";

const resumes = new Hono();

// In-memory storage for uploaded resumes (would be DB in production)
interface StoredResume {
  id: string;
  filename: string;
  uploadedAt: Date;
  extractedData: Awaited<ReturnType<typeof extractResumeData>>;
  questions: Awaited<ReturnType<typeof generateFieldQuestions>>;
}

const uploadedResumes: Map<string, StoredResume> = new Map();

// POST /api/resumes/upload - Accept PDF, extract data, return with questions
resumes.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const provider = (formData.get("provider") as AIProvider) || "anthropic";

    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    if (file.type !== "application/pdf") {
      return c.json({ success: false, error: "File must be a PDF" }, 400);
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const parseResult = await parsePdf(buffer);
    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: parseResult.error.code,
          message: parseResult.error.message,
        },
        400
      );
    }

    // Extract resume data using AI
    const extractionResult = await extractResumeData(
      parseResult.data.text,
      provider
    );

    // Generate questions for each field
    const questions = generateFieldQuestions(extractionResult.data);

    // Store in memory
    const resumeId = uuidv4();
    const storedResume: StoredResume = {
      id: resumeId,
      filename: file.name,
      uploadedAt: new Date(),
      extractedData: extractionResult,
      questions,
    };

    uploadedResumes.set(resumeId, storedResume);

    return c.json({
      success: true,
      resume: {
        id: resumeId,
        filename: file.name,
        uploadedAt: storedResume.uploadedAt.toISOString(),
        data: extractionResult.data,
        confidences: extractionResult.confidences,
        questions: questions.map((q) => ({
          field: q.field,
          question: q.question,
          value: q.value,
          category: q.category,
        })),
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return c.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /api/resumes/approve - Accept approved fields, create memories in Zvec
resumes.post("/approve", async (c) => {
  try {
    const body = await c.req.json();
    const { resumeId, approvedFields } = body;

    if (!resumeId) {
      return c.json({ success: false, error: "resumeId required" }, 400);
    }

    const storedResume = uploadedResumes.get(resumeId);
    if (!storedResume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    // Use approved fields or fall back to extracted data
    const dataToSave = approvedFields || storedResume.extractedData.data;

    // Generate questions for the data being saved
    const questions = generateFieldQuestions(dataToSave);
    const memoryQuestions = toMemoryQuestions(questions);

    // Initialize database if needed
    await initDb();

    if (!memoriesTable) {
      return c.json(
        { success: false, error: "Database not initialized" },
        500
      );
    }

    // Create memories for each field with question
    const createdMemories = [];
    const now = Date.now();

    for (const mem of memoryQuestions) {
      const memoryId = uuidv4();

      // Generate embedding for the question
      const embedding = await generateEmbedding(mem.question);

      await memoriesTable.add([
        {
          id: memoryId,
          question: mem.question,
          answer: mem.answer,
          category: mem.category,
          source: "resume",
          usage_count: BigInt(0),
          last_used: BigInt(now),
          created_at: BigInt(now),
          vector: embedding,
        },
      ]);

      createdMemories.push({
        id: memoryId,
        question: mem.question,
        answer: mem.answer,
        category: mem.category,
      });
    }

    // Clean up stored resume
    uploadedResumes.delete(resumeId);

    return c.json({
      success: true,
      memories: createdMemories,
      count: createdMemories.length,
    });
  } catch (error) {
    console.error("Resume approve error:", error);
    return c.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// GET /api/resumes - List uploaded resumes
resumes.get("/", async (c) => {
  const resumesList = Array.from(uploadedResumes.values()).map((r) => ({
    id: r.id,
    filename: r.filename,
    uploadedAt: r.uploadedAt.toISOString(),
  }));

  return c.json({
    success: true,
    resumes: resumesList,
  });
});

// GET /api/resumes/:id - Get specific resume
resumes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const resume = uploadedResumes.get(id);

  if (!resume) {
    return c.json({ success: false, error: "Resume not found" }, 404);
  }

  return c.json({
    success: true,
    resume: {
      id: resume.id,
      filename: resume.filename,
      uploadedAt: resume.uploadedAt.toISOString(),
      data: resume.extractedData.data,
      confidences: resume.extractedData.confidences,
      questions: resume.questions.map((q) => ({
        field: q.field,
        question: q.question,
        value: q.value,
        category: q.category,
      })),
    },
  });
});

export default resumes;
