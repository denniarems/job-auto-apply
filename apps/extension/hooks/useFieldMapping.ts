/**
 * useFieldMapping - Hook for field-to-memory matching logic
 * Integrates with the backend API for form detection, field extraction, and memory matching
 */

import { useState, useCallback } from 'react';

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

interface FormData {
  action: string;
  method: string;
  fields: FormField[];
  url: string;
  atsType?: 'greenhouse' | 'lever' | 'workday' | 'other';
}

interface DetectedField {
  category: 'personal' | 'contact' | 'experience' | 'education' | 'salary' | 'skills' | 'other';
  semanticName: string;
  inputName: string;
  memoryQuestion: string;
  keywords: string[];
}

interface DetectionResult {
  isJobApplication: boolean;
  confidence: number;
  atsType: 'greenhouse' | 'lever' | 'workday' | 'other' | null;
  detectedFields: DetectedField[];
}

interface MemoryMatch {
  memoryId: string;
  question: string;
  answer: string;
  confidence: number;
  source: 'memory' | 'resume' | 'manual';
  fieldIndex?: number; // Index in the detectedFields array
}

interface FieldMapping {
  field: FormField;
  detected: DetectedField;
  matches: MemoryMatch[];
  selectedMatch?: MemoryMatch;
  status: 'pending' | 'mapped' | 'unmapped' | 'failed';
  source?: 'memory' | 'resume' | 'manual' | 'skip';
}

interface UseFieldMappingReturn {
  mappings: FieldMapping[];
  loading: boolean;
  error: string | null;
  detectForms: (forms: FormData[], url?: string) => Promise<DetectionResult[]>;
  extractFields: (forms: FormData[]) => Promise<DetectedField[]>;
  matchFields: (detectedFields: DetectedField[], url?: string) => Promise<void>;
  updateMapping: (index: number, match: MemoryMatch) => void;
  addMemoryForField: (index: number, value: string, createMemory: boolean) => Promise<void>;
  reset: () => void;
}

// Default backend URL
const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export function useFieldMapping(backendUrl: string = DEFAULT_BACKEND_URL): UseFieldMappingReturn {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMappings([]);
    setError(null);
    setLoading(false);
  }, []);

  // Step 1: Detect if forms are job applications
  const detectForms = useCallback(async (forms: FormData[], url?: string): Promise<DetectionResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/forms/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forms, url: url || window.location.href }),
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const results: DetectionResult[] = await response.json();
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useFieldMapping] Detect error:', message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Step 2: Extract semantic categories for fields
  const extractFields = useCallback(async (forms: FormData[]): Promise<DetectedField[]> => {
    setLoading(true);
    setError(null);

    try {
      const allFields = forms.flatMap((f) => f.fields);
      
      const response = await fetch(`${backendUrl}/api/fields/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: allFields }),
      });

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.detectedFields || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useFieldMapping] Extract error:', message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Step 3: Match fields to memories
  const matchFields = useCallback(async (detectedFields: DetectedField[], url?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/mappings/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          detectedFields,
          url: url || window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error(`Matching failed: ${response.statusText}`);
      }

      const result = await response.json();
      const matches: MemoryMatch[] = result.matches || [];

      // Map to FieldMapping objects
      const newMappings: FieldMapping[] = detectedFields.map((detected, index) => {
        const fieldMatches = matches.filter((m: MemoryMatch) => m.fieldIndex === index);
        
        // Auto-select best match (>=85% confidence)
        const bestMatch = fieldMatches.find((m: MemoryMatch) => m.confidence >= 85);
        
        return {
          field: {} as FormField, // Will be filled from actual form data
          detected,
          matches: fieldMatches,
          selectedMatch: bestMatch,
          status: bestMatch ? 'mapped' : fieldMatches.length > 0 ? 'pending' : 'unmapped',
        };
      });

      setMappings(newMappings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useFieldMapping] Match error:', message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Update selected match for a field
  const updateMapping = useCallback((index: number, match: MemoryMatch) => {
    setMappings((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          selectedMatch: match,
          status: 'mapped',
          source: match.source,
        };
      }
      return updated;
    });
  }, []);

  // Add new memory for unmapped field
  const addMemoryForField = useCallback(async (index: number, value: string, createMemory: boolean): Promise<void> => {
    const mapping = mappings[index];
    if (!mapping) return;

    if (createMemory) {
      setLoading(true);
      try {
        // Create new memory via API
        await fetch(`${backendUrl}/api/memories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: mapping.detected.memoryQuestion || `What is your ${mapping.detected.semanticName}?`,
            answer: value,
            category: mapping.detected.category,
          }),
        });
      } catch (err) {
        console.error('[useFieldMapping] Failed to create memory:', err);
      } finally {
        setLoading(false);
      }
    }

    // Update mapping with manual value
    const manualMatch: MemoryMatch = {
      memoryId: `manual-${Date.now()}`,
      question: mapping.detected.memoryQuestion || mapping.detected.semanticName,
      answer: value,
      confidence: 100,
      source: 'manual',
    };

    updateMapping(index, manualMatch);
  }, [mappings, backendUrl, updateMapping]);

  return {
    mappings,
    loading,
    error,
    detectForms,
    extractFields,
    matchFields,
    updateMapping,
    addMemoryForField,
    reset,
  };
}

export type { UseFieldMappingReturn, FieldMapping, MemoryMatch, DetectedField, FormData };
