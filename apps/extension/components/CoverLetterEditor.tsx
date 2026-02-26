import { useState } from "react";
import { CoverLetterPreview } from "./CoverLetterPreview";
import { RefreshCw, Download, X, Save, Eye, EyeOff } from "lucide-react";

interface CoverLetterEditorProps {
  content: string;
  companyName: string;
  position: string;
  onRegenerate: () => void;
  onDownload: () => void;
  onSave: (content: string) => void;
  onCancel: () => void;
  isGenerating?: boolean;
  isDownloading?: boolean;
}

export function CoverLetterEditor({
  content,
  companyName,
  position,
  onRegenerate,
  onDownload,
  onSave,
  onCancel,
  isGenerating = false,
  isDownloading = false,
}: CoverLetterEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [showPreview, setShowPreview] = useState(true);

  const handleSave = () => {
    onSave(editedContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800">Edit Cover Letter</h3>
          <p className="text-xs text-slate-500">{companyName} - {position}</p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Preview
            </>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} flex flex-col border-r`}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="flex-1 p-4 resize-none outline-none text-sm text-slate-700 leading-relaxed font-mono"
            placeholder="Enter your cover letter content..."
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto p-4 bg-slate-100">
            <CoverLetterPreview
              content={editedContent}
              companyName={companyName}
              position={position}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-white">
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloading ? "animate-pulse" : ""}`} />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
