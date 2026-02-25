import { useState, useEffect } from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { Memories } from "./Memories";
import { ResumeUpload } from "./ResumeUpload";
import { ResumeReview } from "./ResumeReview";
import { 
  Rocket, 
  Brain,
  FileText, 
  Settings as SettingsIcon,
  Circle,
  Check,
  AlertCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_BACKEND_URL = "http://localhost:3000";

interface ResumeData {
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

interface ResumeQuestion {
  field: string;
  question: string;
  value: string;
  category: string;
}

interface ResumeConfidence {
  field: string;
  confidence: "high" | "medium" | "low";
  originalValue: string;
}

interface UploadedResume {
  id: string;
  data: ResumeData;
  questions: ResumeQuestion[];
  confidences: ResumeConfidence[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("main");
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentResume, setCurrentResume] = useState<UploadedResume | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { status } = useBackendStatus();

  // Load settings from chrome.storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const win = window as unknown as { chrome?: { storage?: { local?: { get: (keys: string[]) => Promise<Record<string, string>> } } } };
        if (win.chrome?.storage?.local) {
          const result = await win.chrome.storage.local.get(["backendUrl", "selectedProvider"]);
          if (result.backendUrl) setBackendUrl(result.backendUrl);
          if (result.selectedProvider) setSelectedProvider(result.selectedProvider);
        }
      } catch (e) {
        console.log("Could not load settings:", e);
      }
    };
    loadSettings();
  }, []);

  const handleUploadComplete = (resume: {
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
  }) => {
    setCurrentResume(resume as unknown as UploadedResume);
    setUploadSuccess(true);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(false);
  };

  const handleSaveComplete = async (approvedFields: ResumeData) => {
    setIsSaving(true);
    // The ResumeReview component handles the API call
    // Just show success and reset
    setTimeout(() => {
      setIsSaving(false);
      setCurrentResume(null);
      setUploadSuccess(false);
      setActiveTab("memories");
    }, 1000);
  };

  const handleCancelReview = () => {
    setCurrentResume(null);
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            J
          </div>
          <h1 className="font-bold text-lg">Job Auto-Apply</h1>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border rounded-full text-xs font-medium">
          <Circle 
            className={cn(
              "w-2 h-2 fill-current", 
              status === "online" ? "text-green-500" : status === "offline" ? "text-red-500" : "text-slate-300"
            )} 
          />
          <span className="capitalize">{status}</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === "main" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Ready to Start?</h2>
              <p className="text-sm text-slate-500 px-8">
                Navigate to a job application page and click the button below to begin.
              </p>
            </div>
            
            <button className="group relative px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-3">
              <Rocket className="w-6 h-6 group-hover:animate-bounce" />
              Start Auto-Fill
            </button>

            <div className="w-full max-w-[280px] space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left block">
                AI Provider
              </label>
              <select 
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full p-3 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="anthropic">Claude (Recommended)</option>
                <option value="google">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "memories" && (
          <Memories />
        )}

        {activeTab === "resumes" && (
          <div className="space-y-4">
            {!currentResume ? (
              <>
                <h2 className="text-lg font-bold">Upload Resume</h2>
                
                {/* Success Message */}
                {uploadSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    <Check className="w-5 h-5" />
                    <span>Resume uploaded! Review and save.</span>
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <ResumeUpload
                  backendUrl={backendUrl}
                  selectedProvider={selectedProvider}
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
              </>
            ) : (
              <ResumeReview
                resume={currentResume}
                backendUrl={backendUrl}
                onSave={handleSaveComplete}
                onCancel={handleCancelReview}
              />
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Settings</h2>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backend URL</span>
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="text-sm text-slate-500 border rounded px-2 py-1"
                  placeholder="http://localhost:3000"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Local Backend Port</span>
                <span className="text-sm text-slate-500">3000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Threshold</span>
                <span className="text-sm text-slate-500">85%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              API keys are managed via the backend .env file.
            </p>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="border-t flex items-center justify-around p-2 bg-slate-50">
        <TabButton 
          active={activeTab === "main"} 
          onClick={() => setActiveTab("main")}
          icon={<Rocket className="w-5 h-5" />}
          label="Main"
        />
        <TabButton 
          active={activeTab === "memories"} 
          onClick={() => setActiveTab("memories")}
          icon={<Brain className="w-5 h-5" />}
          label="Memories"
        />
        <TabButton 
          active={activeTab === "resumes"} 
          onClick={() => setActiveTab("resumes")}
          icon={<FileText className="w-5 h-5" />}
          label="Resumes"
        />
        <TabButton 
          active={activeTab === "settings"} 
          onClick={() => setActiveTab("settings")}
          icon={<SettingsIcon className="w-5 h-5" />}
          label="Settings"
        />
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
        active ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
