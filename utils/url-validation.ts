/**
 * URL validation utilities for social media platforms
 */

// Regular expressions for validating different platform URLs
const URL_PATTERNS = {
  website: /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\/.*)?$/,
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/,
  twitter: /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]{1,15}\/?$|^@[a-zA-Z0-9_]{1,15}$/,
  telegram: /^(https?:\/\/)?(www\.)?t\.me\/[a-zA-Z0-9_]{5,32}\/?$|^@[a-zA-Z0-9_]{5,32}$/,
  blog: /^https?:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\/.*)?$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  contactMethod: /^$/, // Placeholder - actual validation happens in isValidURL
};

export type URLType = keyof typeof URL_PATTERNS;

/**
 * Validates a URL based on platform type
 * @param url URL to validate
 * @param type Platform type
 * @returns Boolean indicating if URL is valid
 */
export const isValidURL = (url: string, type: URLType): boolean => {
  if (!url) return true; // Empty URLs are valid (not required)
  
  // For contact method, check if it's either a valid email or website URL
  if (type === 'contactMethod') {
    return URL_PATTERNS.email.test(url) || URL_PATTERNS.website.test(url);
  }
  
  const pattern = URL_PATTERNS[type];
  if (!pattern) return URL_PATTERNS.website.test(url); // Default to website validation
  
  return pattern.test(url);
};

/**
 * Get error message for an invalid URL
 * @param type Platform type
 * @returns Error message string
 */
export const getURLErrorMessage = (type: URLType): string => {
  const messages: Record<URLType, string> = {
    website: 'Please enter a valid website URL (e.g., https://example.com)',
    linkedin: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)',
    twitter: 'Please enter a valid Twitter URL (e.g., https://twitter.com/username or @username)',
    telegram: 'Please enter a valid Telegram handle (e.g., https://t.me/username or @username)',
    blog: 'Please enter a valid blog URL (e.g., https://blog.example.com)',
    email: 'Please enter a valid email address',
    contactMethod: 'Please enter a valid URL or email address',
  };
  
  return messages[type] || 'Please enter a valid URL';
};