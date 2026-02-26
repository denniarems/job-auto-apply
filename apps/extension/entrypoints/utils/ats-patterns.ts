/**
 * ATS-specific patterns and honeypot detection utilities
 */

import type { FormField } from './dom';

// ATS-specific CSS selectors
export const ATS_SELECTORS: Record<string, string[]> = {
  greenhouse: [
    '[data-qa*="application"]',
    '.application-form',
    '.job-application-form',
    'form[action*="greenhouse"]',
    '[data-qa*="job-application"]',
    '.greenhouse-form',
  ],
  lever: [
    '.application-form',
    '[data-modal*="application"]',
    'form[action*="lever"]',
    '.posting-apply-form',
    '[data-qa*="apply-form"]',
    '.lever-form',
  ],
  workday: [
    '.-?(?:width|W)\\(-?[0-9]+',  // Workday class pattern
    '[data-automation-id*="formField"]',
    'form[action*="workday"]',
    '.workday-form',
    '[data-automation-id*="TextInput"]',
  ],
  ashby: [
    '.application-form',
    'form[action*="ashby"]',
    '[data-testid*="application"]',
  ],
  leverjs: [
    '.application-form',
    'form[action*="lever"]',
  ],
};

/**
 * Honeypot field name patterns
 */
const HONEYPOT_PATTERNS = [
  'website',
  'url', 
  'homepage',
  'confirm_email',
  'email_confirm',
  'spam_check',
  'bot_check',
  'honeypot',
  'hidden_field',
  'robot_field',
];

/**
 * Honeypot CSS class patterns
 */
const HONEYPOT_CLASSES = [
  'honeypot',
  'bot-field',
  'hidden-field',
  'spam-field',
  'robot-field',
  'fake-field',
];

/**
 * Check if a field is a honeypot field
 */
export function isHoneypotField(element: HTMLElement): boolean {
  // Check input type
  const inputType = (element as HTMLInputElement).type;
  if (inputType === 'hidden') {
    return true;
  }

  // Check computed style for visibility
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
    return true;
  }

  // Check position off-screen
  const rect = element.getBoundingClientRect();
  if (rect.left < -1000 || rect.top < -1000) {
    return true;
  }

  // Check name patterns
  const name = (element as HTMLInputElement).name?.toLowerCase() || '';
  const id = element.id?.toLowerCase() || '';
  
  for (const pattern of HONEYPOT_PATTERNS) {
    if (name.includes(pattern) || id.includes(pattern)) {
      return true;
    }
  }

  // Check CSS classes
  const className = element.className?.toLowerCase() || '';
  for (const cls of HONEYPOT_CLASSES) {
    if (className.includes(cls)) {
      return true;
    }
  }

  return false;
}

/**
 * Log honeypot field detection
 */
export function logHoneypot(field: FormField, reason: string): void {
  console.log(`[Honeypot Skipped] ${new Date().toISOString()}`, {
    name: field.name,
    id: field.id,
    type: field.type,
    reason,
  });
}

/**
 * Detect ATS type from page content
 */
export function detectATSType(): 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'other' {
  const url = window.location.href.toLowerCase();
  
  if (url.includes('greenhouse')) return 'greenhouse';
  if (url.includes('lever')) return 'lever';
  if (url.includes('workday')) return 'workday';
  if (url.includes('ashby')) return 'ashby';
  
  // Check page content for ATS indicators
  const pageText = document.body.innerText.toLowerCase();
  
  if (pageText.includes('greenhouse')) return 'greenhouse';
  if (pageText.includes('lever')) return 'lever';
  if (pageText.includes('workday')) return 'workday';
  if (pageText.includes('ashby')) return 'ashby';
  
  // Check for ATS-specific selectors
  for (const [atsType, selectors] of Object.entries(ATS_SELECTORS)) {
    for (const selector of selectors) {
      try {
        if (document.querySelector(selector)) {
          return atsType as 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'other';
        }
      } catch {
        // Invalid selector, skip
      }
    }
  }
  
  return 'other';
}

/**
 * Get ATS-specific selectors
 */
export function getATSSelectors(atsType: string): string[] {
  return ATS_SELECTORS[atsType] || [];
}

/**
 * Filter out honeypot fields from a list
 */
export function filterHoneypotFields(fields: FormField[]): { 
  valid: FormField[]; 
  honeypots: Array<{ field: FormField; reason: string }>;
} {
  const valid: FormField[] = [];
  const honeypots: Array<{ field: FormField; reason: string }> = [];
  
  for (const field of fields) {
    // Create a temporary element to check honeypot status
    const element = document.querySelector(`[name="${CSS.escape(field.name)}"], #${CSS.escape(field.id)}`) as HTMLElement;
    
    if (element && isHoneypotField(element)) {
      let reason = 'Hidden or off-screen';
      const inputEl = element as HTMLInputElement;
      if (inputEl.type === 'hidden') reason = 'type="hidden"';
      else if (field.name.toLowerCase().includes('website') || field.name.toLowerCase().includes('url')) {
        reason = 'Honeypot name pattern';
      }
      else if (element.className?.toLowerCase().includes('honeypot')) {
        reason = 'Honeypot class';
      }
      
      logHoneypot(field, reason);
      honeypots.push({ field, reason });
    } else {
      valid.push(field);
    }
  }
  
  return { valid, honeypots };
}
