import { useState } from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { 
  Rocket, 
  Brain, 
  FileText, 
  Settings as SettingsIcon,
  Circle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("main");
  const { status } = useBackendStatus();

  return (
    <div className="w-[400px] h-[500px] bg-white flex flex-col font-sans text-slate-900">
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
              <select className="w-full p-3 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                <option>Claude (Recommended)</option>
                <option>Gemini</option>
                <option>Qwen</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "memories" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Your Memories</h2>
            <div className="bg-slate-50 border-2 border-dashed rounded-xl p-8 text-center text-slate-400">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No memories stored yet.</p>
            </div>
          </div>
        )}

        {activeTab === "resumes" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Resumes</h2>
            <div className="bg-slate-50 border-2 border-dashed rounded-xl p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No resumes uploaded.</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Settings</h2>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
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
