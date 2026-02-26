// Form field from DOM
export interface FormField {
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

// Form data from content script
export interface FormData {
  action: string;
  method: string;
  fields: FormField[];
  url: string;
  atsType?: 'greenhouse' | 'lever' | 'workday' | 'other';
}

// AI detection result
export interface DetectionResult {
  isJobApplication: boolean;
  confidence: number; // 0-1
  atsType: 'greenhouse' | 'lever' | 'workday' | 'other' | null;
  detectedFields: DetectedField[];
}

export interface DetectedField {
  category: 'personal' | 'contact' | 'experience' | 'education' | 'salary' | 'skills' | 'other';
  semanticName: string;
  inputName: string;
  memoryQuestion: string;
  keywords: string[];
}

// Field-to-memory mapping
export interface MemoryMatch {
  memoryId: string;
  question: string;
  answer: string;
  confidence: number; // 0-100
  source: 'memory' | 'resume' | 'manual';
}

export interface FieldMapping {
  field: FormField;
  detected: DetectedField;
  matches: MemoryMatch[];
  selectedMatch?: MemoryMatch;
  status: 'pending' | 'mapped' | 'unmapped' | 'failed';
  source?: 'memory' | 'resume' | 'manual' | 'skip';
}

// Fill result
export interface FillResult {
  field: FormField;
  success: boolean;
  skipped: boolean;
  error?: string;
  source?: 'memory' | 'resume' | 'manual';
}
