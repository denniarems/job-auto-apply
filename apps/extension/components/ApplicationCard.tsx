import { useState, useEffect } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export type ApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn";

interface Application {
  id: string;
  company: string;
  position: string;
  url?: string;
  status: ApplicationStatus;
  applied_date: string;
}

interface ApplicationCardProps {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-100 text-blue-700 border-blue-200",
  Interviewing: "bg-amber-100 text-amber-700 border-amber-200",
  Offer: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Withdrawn: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusOptions: ApplicationStatus[] = ["Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];

export function ApplicationCard({ application, onStatusChange, onDelete }: ApplicationCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStatusSelect = (status: ApplicationStatus) => {
    onStatusChange(application.id, status);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{application.company}</h3>
          <p className="text-sm text-slate-500 truncate">{application.position}</p>
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate block mt-1"
            >
              {application.url.length > 50 ? `${application.url.substring(0, 50)}...` : application.url}
            </a>
          )}
          <p className="text-xs text-slate-400 mt-2">Applied: {formatDate(application.applied_date)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 hover:opacity-80 transition-opacity",
                statusColors[application.status]
              )}
            >
              {application.status}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors",
                      status === application.status ? "bg-slate-50 font-medium" : ""
                    )}
                  >
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[status])}>
                      {status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(application.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete application"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
