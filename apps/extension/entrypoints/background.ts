import type { FormData, FormField, DetectionResult, FieldMapping } from './types/forms';
import { BACKEND_URL } from '@/lib/env';

// API configuration
const API_BASE_URL = BACKEND_URL;

const API_ENDPOINTS = {
  detect: `${API_BASE_URL}/api/forms/detect`,
  extract: `${API_BASE_URL}/api/fields/extract`,
  match: `${API_BASE_URL}/api/mappings/match`,
};

// Message sent by content script to update the badge (content scripts cannot
// call browser.action directly).
type UpdateBadgeMessage = { action: 'UPDATE_BADGE'; count: number; text: string; color: string };

// All other messages from the content script (discriminated on `type`)
type TypedContentMessage =
  | { type: 'API_DETECT'; forms: FormData[]; url: string; atsType?: string }
  | { type: 'API_EXTRACT'; fields: FormField[]; context?: string }
  | { type: 'API_MATCH'; fields: Array<{ category: string; semanticName: string; inputName: string }>; url?: string }
  | { type: 'DYNAMIC_FORM_DETECTED'; url: string }
  | { type: 'HONEYPOT_SKIPPED'; field: FormField; reason: string }
  | { type: 'FILL_FIELD_RESULT'; fieldName: string; success: boolean; error?: string }
  | { type: 'JOB_APPLICATION_DETECTED'; payload: { company: string; position: string; url: string; detectedAt: string } };

type ContentToBackgroundMessage = TypedContentMessage | UpdateBadgeMessage;

// Response to content script
type BackgroundResponse =
  | DetectionResult[]
  | { error: string }
  | { success: boolean; message?: string };

/**
 * Send API request to backend
 */
async function sendApiRequest<T>(endpoint: string, data: unknown): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Background] API request failed:`, error);
    throw error;
  }
}

/**
 * Update badge based on status
 */
function updateBadge(status: 'form-found' | 'no-forms' | 'error' | 'loading'): void {
  const config: Record<string, { text: string; color: string }> = {
    'form-found': { text: '✓', color: '#22c55e' },
    'no-forms': { text: '0', color: '#6b7280' },
    'error': { text: '!', color: '#ef4444' },
    'loading': { text: '...', color: '#3b82f6' },
  };

  const { text, color } = config[status] || config.error;
  
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });
}

/**
 * Handle messages from content script
 */
async function handleMessage(
  message: ContentToBackgroundMessage, 
  _sender: browser.runtime.MessageSender
): Promise<BackgroundResponse> {
  // Handle UPDATE_BADGE messages sent by content scripts (which cannot call
  // browser.action directly).
  if ('action' in message && message.action === 'UPDATE_BADGE') {
    browser.action.setBadgeText({ text: message.count > 0 ? String(message.count) : message.text });
    browser.action.setBadgeBackgroundColor({ color: message.color });
    return { success: true };
  }

  // From this point on the message is a TypedContentMessage (discriminated on `type`).
  const typedMessage = message as TypedContentMessage;
  console.log('[Background] Received message:', typedMessage.type);

  switch (typedMessage.type) {
    case 'API_DETECT':
      try {
        updateBadge('loading');
        const results = await sendApiRequest<DetectionResult[]>(API_ENDPOINTS.detect, {
          forms: typedMessage.forms,
          url: typedMessage.url,
          atsType: typedMessage.atsType,
        });
        
        const hasJobForm = results.some(r => r.isJobApplication);
        updateBadge(hasJobForm ? 'form-found' : 'no-forms');
        
        return results;
      } catch (error) {
        updateBadge('error');
        return { error: error instanceof Error ? error.message : 'Detection failed' };
      }

    case 'API_EXTRACT':
      try {
        const results = await sendApiRequest<{ fields: Array<{ category: string; name: string }> }>(
          API_ENDPOINTS.extract,
          { fields: typedMessage.fields, context: typedMessage.context }
        );
        return results.fields as unknown as DetectionResult[];
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Extraction failed' };
      }

    case 'API_MATCH':
      try {
        const results = await sendApiRequest<{ mappings: FieldMapping[] }>(
          API_ENDPOINTS.match,
          { fields: typedMessage.fields, url: typedMessage.url }
        );
        return results.mappings as unknown as DetectionResult[];
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Matching failed' };
      }

    case 'DYNAMIC_FORM_DETECTED':
      console.log('[Background] New form detected on:', typedMessage.url);
      return { success: true, message: 'Form detected notification logged' };

    case 'HONEYPOT_SKIPPED':
      console.log('[Background] Honeypot skipped:', typedMessage.field.name, 'Reason:', typedMessage.reason);
      return { success: true };

    case 'FILL_FIELD_RESULT':
      console.log('[Background] Fill result:', typedMessage.fieldName, 'Success:', typedMessage.success);
      if (!typedMessage.success && typedMessage.error) {
        console.error('[Background] Fill error:', typedMessage.error);
      }
      return { success: true };

    case 'JOB_APPLICATION_DETECTED':
      console.log('[Background] Job application detected:', typedMessage.payload);
      // Store pending application for side panel to retrieve
      const pendingApps = await browser.storage.local.get('pendingApplications');
      const apps: unknown[] = (pendingApps.pendingApplications as unknown[]) || [];
      apps.push(typedMessage.payload);
      await browser.storage.local.set({ pendingApplications: apps });
      return { success: true, message: 'Application stored' };

    default:
      return { error: 'Unknown message type' };
  }
}

// Initialize background script
export default defineBackground({
  main() {
    console.log('[Background] Initializing...');
    
    // Set up message listener
    browser.runtime.onMessage.addListener((message, sender) => {
      handleMessage(message as ContentToBackgroundMessage, sender)
        .then(response => {
          // Send response back to content script
          const senderId = sender.tab?.id;
          if (senderId) {
            browser.tabs.sendMessage(senderId, response).catch((e: unknown) => {
              console.warn('[background] Failed to send message to tab:', e);
            });
          }
        })
        .catch(error => {
          console.error('[Background] Message handling error:', error);
        });
      
      // Return true to indicate async response
      return true;
    });

    // Set up badge on startup
    updateBadge('no-forms');
    
    console.log('[Background] Ready');
  },
});
