import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/cn';

// Types from the server/API
interface FormField {
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  autocomplete: string;
  cssHidden: boolean;
  maxLength?: number;
  pattern?: string;
}

interface DetectedField {
  category: 'personal' | 'contact' | 'experience' | 'education' | 'salary' | 'skills' | 'other';
  semanticName: string;
  inputName: string;
  memoryQuestion: string;
  keywords: string[];
}

interface MemoryMatch {
  memoryId: string;
  question: string;
  answer: string;
  confidence: number; // 0-100
  source: 'memory' | 'resume' | 'manual';
}

interface FieldCardProps {
  field: FormField;
  detected: DetectedField;
  matches: MemoryMatch[];
  selectedMatch?: MemoryMatch;
  onSelectMatch: (match: MemoryMatch) => void;
  onAddNew: () => void;
  status: 'pending' | 'mapped' | 'unmapped' | 'failed';
}

const categoryColors: Record<DetectedField['category'], { bg: string; text: string }> = {
  personal: { bg: 'bg-blue-100', text: 'text-blue-700' },
  contact: { bg: 'bg-green-100', text: 'text-green-700' },
  experience: { bg: 'bg-purple-100', text: 'text-purple-700' },
  education: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  salary: { bg: 'bg-red-100', text: 'text-red-700' },
  skills: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const sourceColors: Record<MemoryMatch['source'], { bg: string; text: string; icon: string }> = {
  memory: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'Brain' },
  resume: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'FileText' },
  manual: { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'Edit' },
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return 'bg-green-100';
  if (confidence >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

export function FieldCard({
  field,
  detected,
  matches,
  selectedMatch,
  onSelectMatch,
  onAddNew,
  status,
}: FieldCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fieldLabel = detected.semanticName || field.label || field.name || 'Unknown Field';
  const category = detected.category || 'other';
  const categoryStyle = categoryColors[category];

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    mapped: <Check className="w-4 h-4 text-green-500" />,
    unmapped: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header - always visible */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {statusIcons[status]}
          <div>
            <p className="font-medium text-sm">{fieldLabel}</p>
            <p className="text-xs text-slate-500">{field.name || field.id || 'unnamed'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoryStyle.bg, categoryStyle.text)}>
            {category}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 border-t bg-slate-50">
          {matches.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Match Candidates</p>
              {matches.map((match) => {
                const isSelected = selectedMatch?.memoryId === match.memoryId;
                const sourceStyle = sourceColors[match.source];
                
                return (
                  <button
                    key={match.memoryId}
                    onClick={() => onSelectMatch(match)}
                    className={cn(
                      'w-full p-2 rounded-lg border text-left transition-all',
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{match.question}</p>
                        <p className="text-xs text-slate-500 truncate">{match.answer}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', sourceStyle.bg, sourceStyle.text)}>
                          {match.source}
                        </span>
                        <span className={cn('text-sm font-bold', getConfidenceColor(match.confidence))}>
                          {match.confidence}%
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-slate-500">No match candidates found</p>
            </div>
          )}

          {/* Add new match button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNew();
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add new match
          </button>

          {/* Selected match preview */}
          {selectedMatch && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-medium text-green-700">Selected:</p>
              <p className="text-sm text-green-800 truncate">{selectedMatch.answer}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('text-xs px-1.5 py-0.5 rounded', getConfidenceBg(selectedMatch.confidence), getConfidenceColor(selectedMatch.confidence))}>
                  {selectedMatch.confidence}% match
                </span>
                <span className="text-xs text-green-600">{selectedMatch.source}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { FieldCardProps, FormField, DetectedField, MemoryMatch };
