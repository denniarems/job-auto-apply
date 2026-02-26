/**
 * Event simulation utilities for React/Vue-compatible form filling
 */

import type { FormField } from './dom';

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random delay for human-like typing
 */
function getRandomDelay(min: number = 20, max: number = 50): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Fill an input field with character-by-character typing simulation
 * Dispatches full event chain for React/Vue compatibility
 */
export async function fillField(element: HTMLElement, value: string): Promise<void> {
  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
    throw new Error('Element must be an input or textarea');
  }

  const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

  // Focus the element
  inputElement.focus();

  // Clear existing value
  inputElement.value = '';

  // Character-by-character typing simulation
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    
    // Dispatch beforeinput event
    const beforeInputEvent = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: char,
    });
    inputElement.dispatchEvent(beforeInputEvent);

    // Update the value
    inputElement.value = value.substring(0, i + 1);

    // Dispatch input event
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: char,
    });
    inputElement.dispatchEvent(inputEvent);

    // Random delay for human-like typing
    await sleep(getRandomDelay());
  }

  // Dispatch change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: false,
  });
  inputElement.dispatchEvent(changeEvent);

  // Blur the element
  inputElement.blur();
}

/**
 * Fill a select element
 */
export async function fillSelect(select: HTMLSelectElement, value: string): Promise<void> {
  // Focus
  select.focus();

  // Set value
  select.value = value;

  // Dispatch change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: false,
  });
  select.dispatchEvent(changeEvent);

  // Dispatch blur event
  const blurEvent = new Event('blur', {
    bubbles: true,
    cancelable: false,
  });
  select.dispatchEvent(blurEvent);
}

/**
 * Set visual indicator on a field during/after fill
 */
export function setVisualIndicator(
  element: HTMLElement, 
  status: 'filling' | 'success' | 'failed'
): void {
  const colors = {
    filling: { outline: '2px solid #3b82f6', borderColor: '#3b82f6' },   // Blue
    success: { outline: '2px solid #22c55e', borderColor: '#22c55e' },   // Green
    failed:  { outline: '2px solid #ef4444', borderColor: '#ef4444' },   // Red
  };

  const style = colors[status];
  
  // Store original styles
  const originalOutline = element.style.outline;
  const originalBorderColor = element.style.borderColor;

  element.style.outline = style.outline;
  element.style.borderColor = style.borderColor;

  // Auto-remove 'filling' indicator after a delay
  if (status === 'filling') {
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.borderColor = originalBorderColor;
    }, 3000);
  }
}

/**
 * Remove visual indicator from a field
 */
export function clearVisualIndicator(element: HTMLElement): void {
  element.style.outline = '';
  element.style.borderColor = '';
}

/**
 * Execute fill with visual feedback
 */
export async function fillWithFeedback(
  element: HTMLElement, 
  value: string,
  field: FormField
): Promise<{ success: boolean; error?: string }> {
  try {
    // Show filling indicator
    setVisualIndicator(element, 'filling');

    // Determine fill method based on field type
    if (element instanceof HTMLSelectElement) {
      await fillSelect(element, value);
    } else {
      await fillField(element, value);
    }

    // Show success indicator
    setVisualIndicator(element, 'success');

    return { success: true };
  } catch (error) {
    // Show failed indicator
    setVisualIndicator(element, 'failed');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
