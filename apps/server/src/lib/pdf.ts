import pdf from "pdf-parse";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const pdfParseSchema = z.object({
  text: z.string(),
  numpages: z.number(),
  info: z
    .object({
      Title: z.string().optional(),
      Author: z.string().optional(),
      Subject: z.string().optional(),
      Creator: z.string().optional(),
      Producer: z.string().optional(),
    })
    .optional(),
});

export type PdfParseResult = z.infer<typeof pdfParseSchema>;

export interface ParsedPdfError {
  code: "FILE_TOO_LARGE" | "PASSWORD_PROTECTED" | "CORRUPTED" | "PARSE_ERROR";
  message: string;
}

export type PdfResult =
  | { success: true; data: PdfParseResult }
  | { success: false; error: ParsedPdfError };

const PASSWORD_PROTECTED: PdfResult = {
  success: false,
  error: {
    code: "PASSWORD_PROTECTED",
    message: "PDF is password protected",
  },
};

/**
 * Parse a PDF buffer and extract text content.
 * @param buffer - The PDF file buffer
 * @returns Result containing extracted text and metadata or an error
 */
export async function parsePdf(buffer: Buffer): Promise<PdfResult> {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`,
      },
    };
  }

  let data: Awaited<ReturnType<typeof pdf>>;

  try {
    data = await pdf(buffer);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      message.toLowerCase().includes("password") ||
      message.toLowerCase().includes("encrypted")
    ) {
      return PASSWORD_PROTECTED;
    }
    return {
      success: false,
      error: {
        code: "CORRUPTED",
        message,
      },
    };
  }

  // Validate and parse result
  const result = pdfParseSchema.safeParse({
    text: data.text,
    numpages: data.numpages,
    info: data.info,
  });

  if (!result.success) {
    console.error("[pdf] Zod validation failed:", result.error.issues);
    return {
      success: false,
      error: {
        code: "PARSE_ERROR",
        message: "Failed to parse PDF structure",
      },
    };
  }

  return { success: true, data: result.data };
}
