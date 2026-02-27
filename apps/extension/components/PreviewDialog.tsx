import { useState } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';
import { FieldCard, type FieldCardProps } from './FieldCard';

// Types
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
  confidence: number;
  source: 'memory' | 'resume' | 'manual';
}

interface FieldMapping {
  field: FormField;
  detected: DetectedField;
  matches: MemoryMatch[];
  selectedMatch?: MemoryMatch;
  status: 'pending' | 'mapped' | 'unmapped' | 'failed';
  source?: 'memory' | 'resume' | 'manual' | 'skip';
}

interface FillProgress {
  total: number;
  completed: number;
  currentField: string;
  status: 'idle' | 'filling' | 'success' | 'failed' | 'cancelled';
  results?: FillResult[];
}

interface FillResult {
  field: FormField;
  success: boolean;
  skipped: boolean;
  error?: string;
  source?: 'memory' | 'resume' | 'manual';
}

interface PreviewDialogProps {
  mappings: FieldMapping[];
  onUpdateMapping: (index: number, match: MemoryMatch) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isFilling: boolean;
  fillProgress?: FillProgress | null;
}

export function PreviewDialog({
  mappings,
  onUpdateMapping,
  onConfirm,
  onCancel,
  isFilling,
  fillProgress,
}: PreviewDialogProps) {
  // TODO: UnmappedInput dialog rendering is pending implementation; state kept since onAddNew handler sets it
  const [unmappedInputOpen, setUnmappedInputOpen] = useState<number | null>(null);

  const mappedCount = mappings.filter(m => m.status === 'mapped').length;
  const totalCount = mappings.length;
  const canConfirm = mappedCount > 0 && !isFilling;

  // Handle progress state
  const isComplete = fillProgress?.status === 'success' || fillProgress?.status === 'failed';
  const successCount = fillProgress?.results?.filter(r => r.success).length || 0;
  const failCount = fillProgress?.results?.filter(r => !r.success && !r.skipped).length || 0;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Auto-Fill Preview</h2>
            <p className="text-sm text-slate-500">Review field mappings before filling</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isFilling}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        {isFilling && fillProgress && (
          <div className="px-4 py-3 bg-blue-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {fillProgress.status === 'filling' ? 'Filling in progress...' : 
                 fillProgress.status === 'success' ? 'Complete!' :
                 fillProgress.status === 'failed' ? 'Fill completed with errors' :
                 'Cancelling...'}
              </span>
              <span className="text-sm text-blue-600">
                {fillProgress.completed} / {fillProgress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(fillProgress.completed / fillProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {fillProgress.currentField || 'Processing...'}
            </p>
          </div>
        )}

        {/* Completion summary */}
        {isComplete && (
          <div className={cn(
            'px-4 py-3 border-b',
            fillProgress.status === 'success' ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="flex items-center gap-2">
              {fillProgress.status === 'success' ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Successfully filled {successCount} field(s)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    {successCount} filled, {failCount} failed
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Body - Field list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mappings.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No fields detected on this page</p>
            </div>
          ) : (
            mappings.map((mapping, index) => (
              <FieldCard
                key={`${mapping.field.name || mapping.field.id || index}`}
                field={mapping.field}
                detected={mapping.detected}
                matches={mapping.matches}
                selectedMatch={mapping.selectedMatch}
                onSelectMatch={(match) => onUpdateMapping(index, match)}
                onAddNew={() => setUnmappedInputOpen(index)}
                status={mapping.status}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-slate-50">
          <button
            onClick={onCancel}
            disabled={isFilling}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {mappedCount} of {totalCount} mapped
            </span>
          </div>
          
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
              canConfirm
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {isFilling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Filling...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Fill Fields
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { PreviewDialogProps, FieldMapping, FillProgress, FillResult };
