import { extractForms, extractFormsDeep } from './utils/dom';
import type { FormData, FormField } from './utils/dom';
import { fillWithFeedback } from './utils/events';
import { isHoneypotField, detectATSType } from './utils/ats-patterns';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    runContentScript();
  },
});

// Message types for communication with background script
type ContentMessage =
  | { type: 'DETECT_FORMS' }
  | { type: 'FILL_FIELDS'; mappings: FieldMapping[] }
  | { type: 'GET_STATUS' };

type ContentResponse =
  | { type: 'DETECT_FORMS_RESULT'; results: DetectionResult[] }
  | { type: 'FILL_FIELDS_RESULT'; results: FillResult[] }
  | { type: 'GET_STATUS_RESULT'; status: ExtensionStatus }
  | { type: 'FORM_DETECTED'; form: FormData }
  | { type: 'HONEYPOT_SKIPPED'; field: FormField; reason: string }
  | { type: 'ERROR'; error: string };

// Field mapping from API
interface FieldMapping {
  fieldName: string;
  fieldId: string;
  value: string;
  category?: string;
}

// Detection result from API
interface DetectionResult {
  isJobApplication: boolean;
  confidence: number;
  atsType: string | null;
  detectedFields: Array<{
    category: string;
    semanticName: string;
    inputName: string;
  }>;
}

// Fill result
interface FillResult {
  fieldName: string;
  success: boolean;
  skipped: boolean;
  error?: string;
}

// Extension status
interface ExtensionStatus {
  hasForms: boolean;
  formCount: number;
  lastScan: number | null;
  isFilling: boolean;
}

// Current state
let currentStatus: ExtensionStatus = {
  hasForms: false,
  formCount: 0,
  lastScan: null,
  isFilling: false,
};

// MutationObserver for dynamic forms
let formObserver: MutationObserver | null = null;

/**
 * Scan and detect forms on the page
 */
async function scanAndDetectForms(): Promise<DetectionResult[]> {
  // Extract forms including shadow DOM
  const forms = extractFormsDeep();
  
  if (forms.length === 0) {
    updateBadge('noForms');
    return [];
  }

  currentStatus.hasForms = true;
  currentStatus.formCount = forms.length;
  currentStatus.lastScan = Date.now();

  // Detect ATS type
  const atsType = detectATSType();

  try {
    // Send to background for API detection
    const response = await sendToBackground({
      type: 'API_DETECT',
      forms,
      url: window.location.href,
      atsType,
    });

    const results = response as DetectionResult[];
    
    // Update badge based on results
    const hasJobForm = results.some(r => r.isJobApplication);
    updateBadge(hasJobForm ? 'formFound' : 'noForms');

    return results;
  } catch (error) {
    console.error('[Content] Form detection error:', error);
    updateBadge('error');
    return [];
  }
}

/**
 * Execute field filling based on mappings from API
 */
async function executeFill(mappings: FieldMapping[]): Promise<FillResult[]> {
  if (currentStatus.isFilling) {
    throw new Error('Fill already in progress');
  }

  currentStatus.isFilling = true;
  const results: FillResult[] = [];

  try {
    // Get all fields from the page
    const forms = extractFormsDeep();
    const allFields = forms.flatMap((f: FormData) => f.fields);

    for (const mapping of mappings) {
      // Find the field element
      let element: HTMLElement | null = null;
      
      // Try by name first
      if (mapping.fieldName) {
        element = document.querySelector(`[name="${CSS.escape(mapping.fieldName)}"]`) as HTMLElement;
      }
      
      // Try by id
      if (!element && mapping.fieldId) {
        element = document.getElementById(mapping.fieldId) as HTMLElement;
      }

      if (!element) {
        results.push({
          fieldName: mapping.fieldName || mapping.fieldId || 'unknown',
          success: false,
          skipped: false,
          error: 'Field not found on page',
        });
        continue;
      }

      // Check if honeypot
      if (isHoneypotField(element)) {
        const reason = 'Honeypot field detected';
        const fieldData: FormField = { 
          type: element.tagName, 
          name: mapping.fieldName, 
          id: mapping.fieldId, 
          label: '', 
          placeholder: '', 
          required: false, 
          autocomplete: '', 
          cssHidden: false 
        };
        sendToBackground({
          type: 'HONEYPOT_SKIPPED',
          field: fieldData,
          reason,
        });
        results.push({
          fieldName: mapping.fieldName,
          success: false,
          skipped: true,
        });
        continue;
      }

      // Check if already filled
      const inputEl = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (inputEl.value && inputEl.value.length > 0) {
        results.push({
          fieldName: mapping.fieldName,
          success: false,
          skipped: true,
          error: 'Field already has value',
        });
        continue;
      }

      // Fill the field
      const fieldData: FormField = {
        type: inputEl.type || 'text',
        name: inputEl.name || '',
        id: inputEl.id || '',
        label: '',
        placeholder: (inputEl as HTMLInputElement).placeholder || (inputEl as HTMLTextAreaElement).placeholder || '',
        required: inputEl.required || false,
        autocomplete: inputEl.getAttribute('autocomplete') || '',
        cssHidden: false,
      };

      const fillResult = await fillWithFeedback(element, mapping.value, fieldData);
      
      results.push({
        fieldName: mapping.fieldName,
        success: fillResult.success,
        skipped: false,
        error: fillResult.error,
      });

      // Report to background
      sendToBackground({
        type: 'FILL_FIELD_RESULT',
        fieldName: mapping.fieldName,
        success: fillResult.success,
        error: fillResult.error,
      });
    }

    return results;
  } finally {
    currentStatus.isFilling = false;
  }
}

/**
 * Send message to background script
 */
function sendToBackground(message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response: unknown) => {
      if (browser.runtime.lastError) {
        reject(new Error(browser.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

type BadgeStatus = 'formFound' | 'noForms' | 'error' | 'filling';

/**
 * Update extension badge
 */
function updateBadge(status: BadgeStatus): void {
  const config: Record<BadgeStatus, { text: string; color: string }> = {
    formFound: { text: '✓', color: '#22c55e' },
    noForms: { text: '0', color: '#6b7280' },
    error: { text: '!', color: '#ef4444' },
    filling: { text: '...', color: '#3b82f6' },
  };

  const { text, color } = config[status];
  
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });
}

/**
 * Set up MutationObserver for dynamic forms
 */
function setupFormObserver(): void {
  if (formObserver) {
    formObserver.disconnect();
  }

  formObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new form was added
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            const forms = node.querySelectorAll?.('form');
            if (forms && forms.length > 0) {
              // Notify background about new form
              sendToBackground({
                type: 'DYNAMIC_FORM_DETECTED',
                url: window.location.href,
              });
              break;
            }
          }
        }
      }
    }
  });

  formObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Handle messages from popup/background
 */
function handleMessage(message: ContentMessage): ContentResponse {
  switch (message.type) {
    case 'DETECT_FORMS':
      scanAndDetectForms().then(results => {
        browser.runtime.sendMessage({
          type: 'DETECT_FORMS_RESULT',
          results,
        });
      });
      return { type: 'DETECT_FORMS_RESULT', results: [] };

    case 'FILL_FIELDS':
      executeFill(message.mappings).then(results => {
        browser.runtime.sendMessage({
          type: 'FILL_FIELDS_RESULT',
          results,
        });
      });
      return { type: 'FILL_FIELDS_RESULT', results: [] };

    case 'GET_STATUS':
      return { type: 'GET_STATUS_RESULT', status: currentStatus };

    default:
      return { type: 'ERROR', error: 'Unknown message type' };
  }
}

/**
 * Run the content script
 */
function runContentScript(): void {
  console.log('[Content Script] Initializing form detection...');
  
  // Set up message listener
  browser.runtime.onMessage.addListener((message: ContentMessage, _sender: unknown, sendResponse: (response: ContentResponse) => void) => {
    const response = handleMessage(message);
    sendResponse(response);
    return true;
  });

  // Set up MutationObserver for dynamic forms
  setupFormObserver();

  // Initial form detection (optional - could be triggered manually instead)
  console.log('[Content Script] Ready. Waiting for DETECT_FORMS message.');
}
