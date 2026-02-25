import { useState } from "react";
import {
  Check,
  X,
  Edit2,
  Save,
  AlertTriangle,
  CheckCircle,
  Brain,
  Trash2,
} from "lucide-react";

interface Question {
  field: string;
  question: string;
  value: string;
  category: string;
}

interface Confidence {
  field: string;
  confidence: "high" | "medium" | "low";
  originalValue: string;
}

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

interface ResumeReviewProps {
  resume: {
    id: string;
    data: ResumeData;
    questions: Question[];
    confidences: Confidence[];
  };
  onSave: (approvedFields: ResumeData) => void;
  onCancel: () => void;
  backendUrl: string;
}

export function ResumeReview({
  resume,
  onSave,
  onCancel,
  backendUrl,
}: ResumeReviewProps) {
  const [editedData, setEditedData] = useState<ResumeData>(resume.data);
  const [isSaving, setIsSaving] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  const getConfidenceColor = (field: string): string => {
    const conf = resume.confidences.find((c) => c.field === field);
    switch (conf?.confidence) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-slate-400";
    }
  };

  const getConfidenceIcon = (field: string) => {
    const conf = resume.confidences.find((c) => c.field === field);
    switch (conf?.confidence) {
      case "high":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const updateField = (path: string, value: string) => {
    const keys = path.split(".");
    setEditedData((prev) => {
      const updated = { ...prev };
      let current: Record<string, unknown> = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      // Check if this is an array field like "workExperience.0.company"
      const arrayMatch = lastKey.match(/^(\w+)\.(\d+)$/);
      if (arrayMatch) {
        const [, arrayKey, indexStr] = arrayMatch;
        const arrIndex = parseInt(indexStr);
        const parentKey = keys[keys.length - 2];
        
        if (parentKey && !isNaN(arrIndex)) {
          const parentArray = (current[parentKey] as unknown[]) || [];
          const arr = [...parentArray];
          if (arr[arrIndex] && typeof arr[arrIndex] === "object") {
            arr[arrIndex] = { ...(arr[arrIndex] as object), [arrayKey]: value };
            (current as Record<string, unknown>)[parentKey] = arr;
          }
        }
      } else {
        current[lastKey] = value;
      }

      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${backendUrl}/api/resumes/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resume.id,
          approvedFields: editedData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error);
      }

      onSave(editedData);
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Group questions by category
  const groupedQuestions = resume.questions.reduce(
    (acc, q) => {
      if (!acc[q.category]) {
        acc[q.category] = [];
      }
      acc[q.category].push(q);
      return acc;
    },
    {} as Record<string, Question[]>
  );

  const getValueAtPath = (data: ResumeData, path: string): string => {
    const keys = path.split(".");
    let current: unknown = data;

    for (const key of keys) {
      if (current === null || current === undefined) return "";
      // Handle array indices like workExperience.0.company
      const match = key.match(/^(\w+)\.(\d+)$/);
      if (match) {
        const [, arrayKey, index] = match;
        current = (current as Record<string, unknown[]>)[arrayKey];
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        }
      } else {
        current = (current as Record<string, unknown>)[key];
      }
    }

    if (typeof current === "string") return current;
    if (Array.isArray(current)) return current.join(", ");
    if (current === null || current === undefined) return "";
    return JSON.stringify(current);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Review Extracted Data</h2>
        <button
          onClick={() => setShowMemories(!showMemories)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Brain className="w-4 h-4" />
          {showMemories ? "Hide" : "Show"} Questions
        </button>
      </div>

      {/* Memory Questions Preview */}
      {showMemories && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-600">Memory Questions</h3>
          {resume.questions.slice(0, 10).map((q, idx) => (
            <div key={idx} className="text-sm">
              <p className="text-slate-700 font-medium">{q.question}</p>
              <p className="text-slate-500 text-xs">{q.value || "(empty)"}</p>
            </div>
          ))}
          {resume.questions.length > 10 && (
            <p className="text-xs text-slate-400">
              +{resume.questions.length - 10} more questions
            </p>
          )}
        </div>
      )}

      {/* Extracted Fields */}
      <div className="space-y-4">
        {/* Personal Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Personal Information
          </h3>

          <FieldEditor
            label="Full Name"
            value={editedData.fullName || ""}
            onChange={(v) => updateField("fullName", v)}
            confidence={getConfidenceColor("fullName")}
            confidenceIcon={getConfidenceIcon("fullName")}
          />

          <FieldEditor
            label="Email"
            value={editedData.email || ""}
            onChange={(v) => updateField("email", v)}
            confidence={getConfidenceColor("email")}
            confidenceIcon={getConfidenceIcon("email")}
          />

          <FieldEditor
            label="Phone"
            value={editedData.phone || ""}
            onChange={(v) => updateField("phone", v)}
            confidence={getConfidenceColor("phone")}
            confidenceIcon={getConfidenceIcon("phone")}
          />

          <FieldEditor
            label="Location"
            value={editedData.location || ""}
            onChange={(v) => updateField("location", v)}
            confidence={getConfidenceColor("location")}
            confidenceIcon={getConfidenceIcon("location")}
          />
        </div>

        {/* Summary */}
        {editedData.summary && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Summary
            </h3>
            <textarea
              value={editedData.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl text-sm resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Skills */}
        {editedData.skills && editedData.skills.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {editedData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
            <FieldEditor
              label="Edit Skills (comma separated)"
              value={editedData.skills.join(", ")}
              onChange={(v) => updateField("skills", v)}
              confidence={getConfidenceColor("skills")}
              confidenceIcon={getConfidenceIcon("skills")}
            />
          </div>
        )}

        {/* Work Experience */}
        {editedData.workExperience && editedData.workExperience.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Work Experience
            </h3>
            {editedData.workExperience.map((exp, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-4 space-y-2">
                <FieldEditor
                  label="Company"
                  value={exp.company}
                  onChange={(v) => {
                    const newExp = [...(editedData.workExperience || [])];
                    newExp[idx] = { ...newExp[idx], company: v };
                    setEditedData({ ...editedData, workExperience: newExp });
                  }}
                />
                <FieldEditor
                  label="Title"
                  value={exp.title}
                  onChange={(v) => {
                    const newExp = [...(editedData.workExperience || [])];
                    newExp[idx] = { ...newExp[idx], title: v };
                    setEditedData({ ...editedData, workExperience: newExp });
                  }}
                />
                <FieldEditor
                  label="Description"
                  value={exp.description || ""}
                  onChange={(v) => {
                    const newExp = [...(editedData.workExperience || [])];
                    newExp[idx] = { ...newExp[idx], description: v };
                    setEditedData({ ...editedData, workExperience: newExp });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {editedData.education && editedData.education.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Education
            </h3>
            {editedData.education.map((edu, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-4 space-y-2">
                <FieldEditor
                  label="Institution"
                  value={edu.institution}
                  onChange={(v) => {
                    const newEdu = [...(editedData.education || [])];
                    newEdu[idx] = { ...newEdu[idx], institution: v };
                    setEditedData({ ...editedData, education: newEdu });
                  }}
                />
                <FieldEditor
                  label="Degree"
                  value={edu.degree}
                  onChange={(v) => {
                    const newEdu = [...(editedData.education || [])];
                    newEdu[idx] = { ...newEdu[idx], degree: v };
                    setEditedData({ ...editedData, education: newEdu });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save All to Memory
        </button>
      </div>
    </div>
  );
}

// Field Editor Component
function FieldEditor({
  label,
  value,
  onChange,
  confidence,
  confidenceIcon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  confidence?: string;
  confidenceIcon?: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 p-2 border border-blue-300 rounded-lg text-sm"
          autoFocus
        />
        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-50 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{label}:</span>
        <span className={`text-sm font-medium ${value ? "text-slate-900" : "text-slate-400"}`}>
          {value || "(empty)"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {confidenceIcon}
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
