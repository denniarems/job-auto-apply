interface CoverLetterPreviewProps {
  content: string;
  companyName: string;
  position: string;
}

export function CoverLetterPreview({ content, companyName, position }: CoverLetterPreviewProps) {
  // Split content into paragraphs for better rendering
  const paragraphs = content.split("\n\n").filter(p => p.trim());

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <h3 className="font-bold text-lg text-slate-800">{companyName}</h3>
        <p className="text-sm text-slate-500">{position}</p>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4 text-slate-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
