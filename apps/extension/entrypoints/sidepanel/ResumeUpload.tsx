import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface ResumeUploadProps {
  onUploadComplete: (resume: {
    id: string;
    data: Record<string, unknown>;
    questions: Array<{
      field: string;
      question: string;
      value: string;
      category: string;
    }>;
    confidences: Array<{
      field: string;
      confidence: "high" | "medium" | "low";
      originalValue: string;
    }>;
  }) => void;
  onError: (error: string) => void;
  backendUrl: string;
  selectedProvider: string;
}

export function ResumeUpload({
  onUploadComplete,
  onError,
  backendUrl,
  selectedProvider,
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          setSelectedFile(file);
        } else {
          onError("Please upload a PDF file");
        }
      }
    },
    [onError]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          setSelectedFile(file);
        } else {
          onError("Please upload a PDF file");
        }
      }
    },
    [onError]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("provider", selectedProvider);

      const response = await fetch(`${backendUrl}/api/resumes/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error);
      }

      setUploadProgress(100);
      onUploadComplete(result.resume);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-blue-300"
          }
          ${selectedFile ? "border-green-400 bg-green-50" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-12 h-12 text-green-600" />
            <p className="font-medium text-slate-700">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-12 h-12 text-slate-400" />
            <p className="font-medium text-slate-600">
              Drag and drop your resume here
            </p>
            <p className="text-sm text-slate-400">or click to browse (PDF only)</p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Uploading and extracting...</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload & Extract
        </button>
      )}

      {/* File size hint */}
      <p className="text-xs text-slate-400">Maximum file size: 10MB</p>
    </div>
  );
}
