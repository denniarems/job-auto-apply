/**
 * DOM utilities for field extraction from forms
 * Used by content script to scan pages for form fields
 */

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

export interface FormData {
  action: string;
  method: string;
  fields: FormField[];
  url: string;
}

/**
 * Extract all forms from the page
 */
export function extractForms(): FormData[] {
  const forms = document.querySelectorAll('form');
  return Array.from(forms).map(form => ({
    action: form.action || '',
    method: form.method || 'get',
    fields: extractFields(form),
    url: window.location.href,
  }));
}

/**
 * Extract all fields from a form element
 */
export function extractFields(form: HTMLFormElement): FormField[] {
  const inputs = form.querySelectorAll('input, select, textarea');
  return Array.from(inputs).map(field => {
    const inputEl = field as HTMLInputElement;
    const textareaEl = field as HTMLTextAreaElement;
    const selectEl = field as HTMLSelectElement;
    
    return {
      type: inputEl.type || 'text',
      name: inputEl.name || '',
      id: inputEl.id || '',
      label: findLabel(field),
      placeholder: textareaEl.placeholder || inputEl.placeholder || '',
      required: inputEl.required || false,
      autocomplete: inputEl.getAttribute('autocomplete') || '',
      cssHidden: isCssHidden(field),
      maxLength: inputEl.maxLength > 0 ? inputEl.maxLength : undefined,
      pattern: inputEl.pattern || undefined,
    };
  });
}

/**
 * Find the label text for a form field
 */
export function findLabel(field: Element): string {
  // Check label[for]=field.id
  if (field.id) {
    const labelFor = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (labelFor) {
      return labelFor.textContent?.trim() || '';
    }
  }

  // Check aria-label
  const ariaLabel = field.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  // Check adjacent label element
  const parent = field.parentElement;
  if (parent) {
    const adjacentLabel = parent.querySelector('label');
    if (adjacentLabel) {
      return adjacentLabel.textContent?.trim() || '';
    }
    // Check if parent is a label
    if (parent.tagName === 'LABEL') {
      return parent.textContent?.trim() || '';
    }
  }

  // Check for common label class patterns
  const closestLabel = field.closest('[class*="label"]');
  if (closestLabel) {
    const labelText = closestLabel.textContent?.trim();
    if (labelText) {
      // Remove the field's own value from the label
      const fieldValue = (field as HTMLInputElement).value || (field as HTMLSelectElement).value || '';
      return labelText.replace(fieldValue, '').trim();
    }
  }

  // Check for aria-labelledby
  const ariaLabelledBy = field.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      return labelElement.textContent?.trim() || '';
    }
  }

  return '';
}

/**
 * Check if an element is hidden via CSS
 */
export function isCssHidden(element: Element): boolean {
  const style = window.getComputedStyle(element);
  
  // Check display, visibility, opacity
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
    return true;
  }

  // Check if positioned off-screen
  const rect = element.getBoundingClientRect();
  if (rect.left < -1000 || rect.top < -1000) {
    return true;
  }

  return false;
}

/**
 * Recursively query elements including shadow DOM
 */
export function querySelectorAllDeep(selector: string): Element[] {
  const results: Element[] = [];

  function walk(element: Element) {
    // Query in current element
    try {
      const matches = element.querySelectorAll(selector);
      results.push(...matches);
    } catch (e) {
      // Invalid selector, skip
    }

    // Check shadow roots
    if (element.shadowRoot) {
      walk(element.shadowRoot as unknown as Element);
    }

    // Check for shadow DOM in children
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.shadowRoot) {
        walk(child.shadowRoot as unknown as Element);
      }
      walk(child);
    }
  }

  walk(document.documentElement);
  return results;
}

/**
 * Get surrounding text context for an element (useful for AI)
 */
export function getSurroundingText(element: Element, depth: number = 3): string {
  const parts: string[] = [];
  let current = element.parentElement;
  let currentDepth = 0;

  while (current && currentDepth < depth) {
    const text = current.textContent?.trim();
    if (text && text.length > 0 && text.length < 500) {
      parts.push(text);
    }
    current = current.parentElement;
    currentDepth++;
  }

  return parts.join(' | ');
}

/**
 * Find all forms including those in shadow DOM
 */
export function extractFormsDeep(): FormData[] {
  const forms: FormData[] = [];
  
  // Regular forms
  forms.push(...extractForms());

  // Forms in shadow DOM
  const shadowForms = querySelectorAllDeep('form');
  for (const form of shadowForms) {
    const htmlForm = form as HTMLFormElement;
    forms.push({
      action: htmlForm.action || '',
      method: htmlForm.method || 'get',
      fields: extractFields(htmlForm),
      url: window.location.href,
    });
  }

  return forms;
}
