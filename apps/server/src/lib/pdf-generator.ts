import PDFDocument from "pdfkit";

// Interface for cover letter content sections
export interface CoverLetterContent {
  greeting: string;
  intro: string;
  body: string;
  closing: string;
  signature: string;
}

// Interface for candidate information
export interface CandidateInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
}

// Full cover letter data interface
export interface CoverLetterData {
  content: CoverLetterContent;
  candidate: CandidateInfo;
  company: string;
  position: string;
}

/**
 * Generate a PDF buffer from cover letter data.
 * @param data - The cover letter data including content, candidate info, company and position
 * @returns Promise resolving to a Buffer containing the PDF data
 */
export async function generateCoverLetterPDF(data: CoverLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 72 }); // 1 inch margins

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header: Candidate info
    doc.fontSize(12).text(data.candidate.name, { align: "left" });
    if (data.candidate.email) doc.text(data.candidate.email);
    if (data.candidate.phone) doc.text(data.candidate.phone);
    if (data.candidate.location) doc.text(data.candidate.location);

    doc.moveDown(2);

    // Date in en-US long format
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(dateStr);

    doc.moveDown(2);

    // Company info
    doc.text(data.company);
    doc.text(data.position);

    doc.moveDown(2);

    // Greeting
    doc.fontSize(12).text(data.content.greeting);

    doc.moveDown();

    // Intro
    doc.text(data.content.intro);

    doc.moveDown();

    // Body
    doc.text(data.content.body);

    doc.moveDown();

    // Closing
    doc.text(data.content.closing);

    doc.moveDown(2);

    // Signature
    doc.text(data.content.signature);

    doc.end();
  });
}
