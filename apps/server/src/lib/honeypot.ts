import type { FormField } from "../types/forms";

// Common honeypot field names that are fake/rejected by legitimate users
const HONEYPOT_FIELD_NAMES = [
  "website",
  "url",
  "homepage",
  "confirm_email",
  "email_confirm",
  "spam_check",
  "bot_check",
  "honeypot",
  "bot_field",
  "hidden_field",
  "fake_field",
];

/**
 * Check if a form field is a honeypot field designed to catch bots
 * @param field - The form field to check
 * @returns true if the field appears to be a honeypot
 */
export function isHoneypotField(field: FormField): boolean {
  // Check for hidden input type
  if (field.type === "hidden") {
    return true;
  }

  // Check if CSS indicates hidden field
  if (field.cssHidden) {
    return true;
  }

  // Check field name against known honeypot patterns
  const fieldNameLower = (field.name || "").toLowerCase().trim();
  if (HONEYPOT_FIELD_NAMES.some((name) => fieldNameLower.includes(name))) {
    return true;
  }

  // Check id against honeypot patterns
  const fieldIdLower = (field.id || "").toLowerCase().trim();
  if (HONEYPOT_FIELD_NAMES.some((name) => fieldIdLower.includes(name))) {
    return true;
  }

  return false;
}

/**
 * Log honeypot detection event
 * @param field - The honeypot field that was detected
 * @param url - The URL where the field was detected
 */
export function logHoneypot(field: FormField, url: string): void {
  console.log("[honeypot] Detected honeypot field:", {
    fieldName: field.name,
    fieldId: field.id,
    fieldType: field.type,
    url,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Filter out honeypot fields from a list of form fields
 * @param fields - Array of form fields
 * @param url - URL for logging purposes
 * @returns Array of non-honeypot fields
 */
export function filterHoneypotFields(
  fields: FormField[],
  url: string,
): FormField[] {
  const honeypotFields: FormField[] = [];

  const filtered = fields.filter((field) => {
    if (isHoneypotField(field)) {
      honeypotFields.push(field);
      logHoneypot(field, url);
      return false;
    }
    return true;
  });

  if (honeypotFields.length > 0) {
    console.log(
      `[honeypot] Filtered ${honeypotFields.length} honeypot field(s) from ${fields.length} total fields`,
    );
  }

  return filtered;
}
