import { useState, useEffect, useCallback } from "react";
import { useCoverLetter, type CoverLetterHistoryItem, type ResumeData } from "@/hooks/useCoverLetter";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import { CoverLetterEditor } from "@/components/CoverLetterEditor";
import { FileSignature, Plus, Download, Trash2, Clock, Briefcase, Building } from "lucide-react";

interface CoverLettersProps {
  backendUrl: string;
  selectedProvider: string;
}

type View = "generate" | "edit" | "history";

export function CoverLetters({ backendUrl, selectedProvider }: CoverLettersProps) {
  const { generate, download, getHistory, deleteCoverLetter, isGenerating, isDownloading, error, clearError } = 
    useCoverLetter(backendUrl, selectedProvider);
  
  const [currentView, setCurrentView] = useState<View>("generate");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [history, setHistory] = useState<CoverLetterHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CoverLetterHistoryItem | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  // Load resume data from browser.storage.local
  useEffect(() => {
    const loadResumeData = async () => {
      try {
        const result = await browser.storage.local.get(["resumeData"]);
        if (result.resumeData) {
          setResumeData(result.resumeData as ResumeData);
        }
      } catch (e) {
        console.log("Could not load resume data:", e);
      }
    };
    loadResumeData();
  }, []);

  const loadHistory = useCallback(async () => {
    const items = await getHistory();
    setHistory(items);
  }, [getHistory]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !position.trim()) {
      return;
    }
    try {
      const content = await generate(
        jobDescription,
        resumeData || {},
        companyName,
        position
      );
      setGeneratedContent(content);
      setCurrentView("edit");
      clearError();
    } catch (err) {
      console.error("Generation failed:", err);
    }
  };

  const handleRegenerate = async () => {
    try {
      const content = await generate(
        jobDescription,
        resumeData || {},
        companyName,
        position
      );
      setGeneratedContent(content);
      clearError();
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
  };

  const handleDownload = async () => {
    if (!generatedContent) return;
    try {
      await download(generatedContent, companyName, position);
      await loadHistory();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleSave = (content: string) => {
    setGeneratedContent(content);
    // Optionally save to history here
    loadHistory();
    setCurrentView("history");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoverLetter(id);
      await loadHistory();
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleViewHistory = (item: CoverLetterHistoryItem) => {
    setSelectedHistoryItem(item);
    setCompanyName(item.companyName);
    setPosition(item.position);
    setGeneratedContent(item.content);
    setCurrentView("edit");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setCurrentView("generate")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentView === "generate"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Plus className="w-4 h-4" />
          Generate New
        </button>
        <button
          onClick={() => setCurrentView("history")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentView === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generate View */}
      {currentView === "generate" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <h2 className="font-bold text-lg text-slate-800">Generate Cover Letter</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Enter position title"
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !companyName.trim() || !position.trim() || !jobDescription.trim()}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4" />
                  Generate Cover Letter
                </>
              )}
            </button>

            {!resumeData && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                No resume data found. Please upload a resume in the Resumes tab for personalized cover letters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit View */}
      {currentView === "edit" && generatedContent && (
        <div className="flex-1 overflow-hidden">
          <CoverLetterEditor
            content={generatedContent}
            companyName={companyName}
            position={position}
            onRegenerate={handleRegenerate}
            onDownload={handleDownload}
            onSave={handleSave}
            onCancel={() => setCurrentView("generate")}
            isGenerating={isGenerating}
            isDownloading={isDownloading}
          />
        </div>
      )}

      {/* History View */}
      {currentView === "history" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <h2 className="font-bold text-lg text-slate-800">Cover Letter History</h2>
          
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No cover letters yet</p>
              <p className="text-sm">Generate your first cover letter to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{item.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{item.position}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.generated_at)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewHistory(item)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View/Edit"
                      >
                        <FileSignature className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => download(item.content, item.companyName, item.position)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
