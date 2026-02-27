import { useState } from 'react';
import { Save, X, HelpCircle } from 'lucide-react';
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

interface DetectedField {
  category: 'personal' | 'contact' | 'experience' | 'education' | 'salary' | 'skills' | 'other';
  semanticName: string;
  inputName: string;
  memoryQuestion: string;
  keywords: string[];
}

interface UnmappedInputProps {
  field: FormField;
  detected: DetectedField;
  onSave: (value: string, createMemory: boolean) => void;
  onCancel: () => void;
}

export function UnmappedInput({
  field,
  detected,
  onSave,
  onCancel,
}: UnmappedInputProps) {
  const [value, setValue] = useState('');
  const [createMemory, setCreateMemory] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fieldLabel = detected.semanticName || field.label || field.name || 'Unknown Field';
  const memoryQuestion = detected.memoryQuestion || `What is your ${fieldLabel.toLowerCase()}?`;

  const handleSave = async () => {
    if (!value.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(value.trim(), createMemory);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Add Value</h2>
            <p className="text-sm text-slate-500">Enter a value for this field</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Field info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700">{fieldLabel}</p>
            {detected.category && (
              <p className="text-xs text-slate-500 capitalize">{detected.category}</p>
            )}
          </div>

          {/* Memory question hint */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">{memoryQuestion}</p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Value to fill
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={4}
                autoFocus
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                maxLength={field.maxLength}
                pattern={field.pattern}
                autoFocus
              />
            )}
          </div>

          {/* Save as memory checkbox */}
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={createMemory}
              onChange={(e) => setCreateMemory(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Save as new memory</p>
              <p className="text-xs text-slate-500">
                Store this value for future auto-fill sessions
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!value.trim() || isSaving}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors',
              value.trim() && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { UnmappedInputProps };
