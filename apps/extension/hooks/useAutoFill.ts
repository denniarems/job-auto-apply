/**
 * useAutoFill - Hook for executing form field filling with progress callbacks
 * Communicates with the content script via chrome.runtime.sendMessage
 */

import { useState, useCallback, useEffect, useRef } from 'react';

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

interface MemoryMatch {
  memoryId: string;
  question: string;
  answer: string;
  confidence: number;
  source: 'memory' | 'resume' | 'manual';
}

interface FieldMapping {
  field: FormField;
  fieldName: string;
  fieldId: string;
  value: string;
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

interface UseAutoFillReturn {
  isFilling: boolean;
  progress: FillProgress | null;
  startFill: (mappings: FieldMapping[]) => Promise<FillResult[]>;
  cancelFill: () => void;
  clearProgress: () => void;
}

// Safe default used when spreading into setProgress callbacks where prev may be null
const EMPTY_PROGRESS: FillProgress = {
  total: 0,
  completed: 0,
  currentField: '',
  status: 'idle',
};

// Message types for content script communication
type FillMessage =
  | { type: 'FILL_FIELDS'; mappings: Array<{ fieldName: string; fieldId: string; value: string }> }
  | { type: 'CANCEL_FILL' };

type FillResponse =
  | { type: 'FILL_PROGRESS'; completed: number; total: number; currentField: string }
  | { type: 'FILL_FIELDS_RESULT'; results: FillResult[] }
  | { type: 'ERROR'; error: string };

export function useAutoFill(): UseAutoFillReturn {
  const [isFilling, setIsFilling] = useState(false);
  const [progress, setProgress] = useState<FillProgress | null>(null);
  const resultsRef = useRef<FillResult[]>([]);

  // Ref to track filling state without stale closure issues in setInterval
  const isFillingRef = useRef(isFilling);
  useEffect(() => {
    isFillingRef.current = isFilling;
  }, [isFilling]);

  // Listen for fill progress messages from content script
  useEffect(() => {
    const handleMessage = (message: FillResponse) => {
      if (message.type === 'FILL_PROGRESS') {
        setProgress((prev) => ({
          ...(prev ?? EMPTY_PROGRESS),
          completed: message.completed,
          total: message.total,
          currentField: message.currentField,
          status: 'filling',
        }));
      } else if (message.type === 'FILL_FIELDS_RESULT') {
        resultsRef.current = message.results;
        const failCount = message.results.filter((r) => !r.success && !r.skipped).length;
        
        setProgress((prev) => ({
          ...(prev ?? EMPTY_PROGRESS),
          completed: message.results.length,
          status: failCount > 0 ? 'failed' : 'success',
          results: message.results,
        }));
        setIsFilling(false);
      } else if (message.type === 'ERROR') {
        console.error('[useAutoFill] Fill error:', message.error);
        setProgress((prev) => ({
          ...(prev ?? EMPTY_PROGRESS),
          status: 'failed',
        }));
        setIsFilling(false);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage as (message: unknown) => void);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage as (message: unknown) => void);
    };
  }, []);

  // Send message to content script
  const sendToContent = useCallback((message: FillMessage): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // Get the active tab
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }

        browser.tabs.sendMessage(tabs[0].id, message).then(resolve).catch(reject);
      }).catch(reject);
    });
  }, []);

  // Start the fill process
  const startFill = useCallback(async (mappings: FieldMapping[]): Promise<FillResult[]> => {
    if (isFillingRef.current) {
      throw new Error('Fill already in progress');
    }

    // Filter out unmapped or skipped fields
    const fillableMappings = mappings.filter(
      (m) => m.status === 'mapped' && m.value && !m.source?.includes('skip')
    );

    if (fillableMappings.length === 0) {
      throw new Error('No fields to fill');
    }

    // Reset state
    setIsFilling(true);
    resultsRef.current = [];
    setProgress({
      total: fillableMappings.length,
      completed: 0,
      currentField: '',
      status: 'filling',
    });

    try {
      // Send fill request to content script
      await sendToContent({
        type: 'FILL_FIELDS',
        mappings: fillableMappings.map((m) => ({
          fieldName: m.fieldName || m.field?.name || '',
          fieldId: m.fieldId || m.field?.id || '',
          value: m.value,
        })),
      });

      // Return results (will be updated via message listener)
      // Use isFillingRef instead of isFilling to avoid stale closure
      return new Promise((resolve) => {
        const checkResults = setInterval(() => {
          if (!isFillingRef.current || resultsRef.current.length > 0) {
            clearInterval(checkResults);
            resolve(resultsRef.current);
          }
        }, 100);
        
        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(checkResults);
          resolve(resultsRef.current);
        }, 60000);
      });
    } catch (err) {
      setIsFilling(false);
      setProgress((prev) => ({
        ...(prev ?? EMPTY_PROGRESS),
        status: 'failed',
      }));
      throw err;
    }
  }, [sendToContent]);

  // Cancel the fill process
  const cancelFill = useCallback(() => {
    if (!isFillingRef.current) return;

    sendToContent({ type: 'CANCEL_FILL' }).then(() => {
      setProgress((prev) => ({
        ...(prev ?? EMPTY_PROGRESS),
        status: 'cancelled',
      }));
      setIsFilling(false);
    }).catch((err) => {
      console.error('[useAutoFill] Cancel error:', err);
      // Still update state even if message fails
      setProgress((prev) => ({
        ...(prev ?? EMPTY_PROGRESS),
        status: 'cancelled',
      }));
      setIsFilling(false);
    });
  }, [sendToContent]);

  // Clear progress state
  const clearProgress = useCallback(() => {
    setProgress(null);
    resultsRef.current = [];
  }, []);

  return {
    isFilling,
    progress,
    startFill,
    cancelFill,
    clearProgress,
  };
}

export type { UseAutoFillReturn, FieldMapping, FillProgress, FillResult };
