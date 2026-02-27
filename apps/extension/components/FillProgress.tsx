import { Check, X, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/cn';

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

interface FillResult {
  field: FormField;
  success: boolean;
  skipped: boolean;
  error?: string;
  source?: 'memory' | 'resume' | 'manual';
}

interface FillProgressProps {
  total: number;
  completed: number;
  currentField: string;
  status: 'idle' | 'filling' | 'success' | 'failed' | 'cancelled';
  results?: FillResult[];
  onCancel?: () => void;
}

const statusConfig = {
  idle: { color: 'bg-slate-200', text: 'text-slate-600', label: 'Ready' },
  filling: { color: 'bg-blue-500', text: 'text-blue-600', label: 'Filling in progress...' },
  success: { color: 'bg-green-500', text: 'text-green-600', label: 'Complete!' },
  failed: { color: 'bg-red-500', text: 'text-red-600', label: 'Completed with errors' },
  cancelled: { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'Cancelled' },
};

export function FillProgress({
  total,
  completed,
  currentField,
  status,
  results,
  onCancel,
}: FillProgressProps) {
  const [showDetails, setShowDetails] = useState(false);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const successCount = results?.filter(r => r.success).length || 0;
  const failCount = results?.filter(r => !r.success && !r.skipped).length || 0;
  const skippedCount = results?.filter(r => r.skipped).length || 0;

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'filling' ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : status === 'success' ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : status === 'failed' ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : status === 'cancelled' ? (
            <X className="w-5 h-5 text-yellow-500" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200" />
          )}
          <span className={cn('font-medium', config.text)}>{config.label}</span>
        </div>
        
        <span className="text-sm text-slate-500">
          {completed} / {total} fields
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', config.color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{percentage}%</span>
          {currentField && status === 'filling' && (
            <span className="truncate max-w-[200px]">Filling: {currentField}</span>
          )}
        </div>
      </div>

      {/* Results summary */}
      {results && results.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <Check className="w-4 h-4" />
            {successCount} filled
          </span>
          {failCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" />
              {failCount} failed
            </span>
          )}
          {skippedCount > 0 && (
            <span className="flex items-center gap-1 text-slate-500">
              {skippedCount} skipped
            </span>
          )}
        </div>
      )}

      {/* Expandable details */}
      {results && results.length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'} details
          </button>

          {showDetails && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {results.map((result, index) => {
                const fieldName = result.field.label || result.field.name || result.field.id || `Field ${index + 1}`;
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between p-2 rounded text-sm',
                      result.success ? 'bg-green-50' : 
                      result.skipped ? 'bg-slate-50' : 'bg-red-50'
                    )}
                  >
                    <span className="truncate">{fieldName}</span>
                    {result.success ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : result.skipped ? (
                      <span className="text-xs text-slate-500">skipped</span>
                    ) : (
                      <span className="text-xs text-red-500 truncate max-w-[150px]">
                        {result.error || 'failed'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cancel button */}
      {status === 'filling' && onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          Cancel Fill
        </button>
      )}
    </div>
  );
}

export type { FillProgressProps, FillResult };
