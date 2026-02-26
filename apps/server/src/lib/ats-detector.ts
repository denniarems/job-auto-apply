import type { FormData } from "../types/forms";

export type ATSKind = 'greenhouse' | 'lever' | 'workday' | 'other';

/**
 * Detect the ATS (Applicant Tracking System) type from URL and form data
 * @param url - The URL of the page containing the form
 * @param formData - Optional form data for additional detection
 * @returns The detected ATS type
 */
export function detectATS(url: string, formData?: FormData): ATSKind {
  const urlLower = url.toLowerCase();

  // Greenhouse detection
  if (urlLower.includes('greenhouse')) {
    return 'greenhouse';
  }

  // Lever detection
  if (urlLower.includes('lever')) {
    return 'lever';
  }

  // Workday detection
  if (urlLower.includes('workday')) {
    return 'workday';
  }

  // Additional selector-based detection if form data is provided
  if (formData?.fields) {
    const fieldsJson = JSON.stringify(formData.fields).toLowerCase();

    // Greenhouse selectors
    if (
      fieldsJson.includes('data-qa') ||
      fieldsJson.includes('application-form') ||
      fieldsJson.includes('job-application')
    ) {
      // Could be greenhouse, but check for other patterns first
      if (fieldsJson.includes('greet')) {
        return 'greenhouse';
      }
    }

    // Lever selectors
    if (
      fieldsJson.includes('data-modal') ||
      fieldsJson.includes('lever-form') ||
      fieldsJson.includes('posting-')
    ) {
      return 'lever';
    }

    // Workday selectors (typically have W- prefix on class names)
    if (/\bW\d+\b/.test(fieldsJson) || fieldsJson.includes('workday')) {
      return 'workday';
    }
  }

  return 'other';
}

/**
 * Get CSS selectors specific to an ATS type for form field detection
 * @param atsType - The ATS type to get selectors for
 * @returns Array of CSS selectors for finding form fields
 */
export function getATSSelectors(atsType: string): string[] {
  switch (atsType) {
    case 'greenhouse':
      return [
        'input[name*="first_name"]',
        'input[name*="last_name"]',
        'input[name*="email"]',
        'input[name*="phone"]',
        'input[name*="resume"]',
        'input[name*="cover_letter"]',
        '[data-qa*="input"]',
        '[data-qa*="field"]',
        '.application-form input',
        '.job-application-form input',
        'form[id*="job"] input',
        'form[id*="application"] input',
      ];

    case 'lever':
      return [
        'input[name*="name"]',
        'input[name*="email"]',
        'input[name*="phone"]',
        'input[type="file"]',
        '.lever-form input',
        '.application-form input',
        '[data-modal*="application"]',
        'form[data-provider="lever"] input',
      ];

    case 'workday':
      return [
        'input[name*="firstName"]',
        'input[name*="lastName"]',
        'input[name*="emailAddress"]',
        'input[name*="phoneNumber"]',
        'input[name*="resume"]',
        '.WInput',
        '.WFormInput',
        '[id*="Workday"] input',
        'form[action*="workday"] input',
      ];

    default:
      // Generic selectors that work across most forms
      return [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="file"]',
        'textarea',
        'select',
        'form input[name]',
        'form input[id]',
      ];
  }
}

/**
 * Get the input name patterns commonly used by each ATS type
 * @param atsType - The ATS type
 * @returns Object mapping field types to common input names
 */
export function getATSInputPatterns(atsType: string): Record<string, string[]> {
  switch (atsType) {
    case 'greenhouse':
      return {
        firstName: ['first_name', 'firstName', 'first-name'],
        lastName: ['last_name', 'lastName', 'last-name'],
        email: ['email', 'email_address', 'emailAddress'],
        phone: ['phone', 'phone_number', 'phoneNumber', 'phone-number'],
        resume: ['resume', 'resume_upload', 'resumeUpload', 'resume-file'],
        coverLetter: ['cover_letter', 'coverLetter', 'cover-letter'],
      };

    case 'lever':
      return {
        name: ['name', 'fullName', 'full_name'],
        email: ['email', 'emailAddress'],
        phone: ['phone', 'phoneNumber', 'phone-number'],
        resume: ['resume', 'resumeFile', 'resume_file'],
      };

    case 'workday':
      return {
        firstName: ['firstName', 'First_Name', 'first_name'],
        lastName: ['lastName', 'Last_Name', 'last_name'],
        email: ['emailAddress', 'Email_Address', 'email_address'],
        phone: ['phoneNumber', 'Phone_Number', 'phone_number'],
        resume: ['resume', 'Resume', 'resumeUpload'],
      };

    default:
      return {};
  }
}
