import { SIGN_UP } from "@/utils/constants";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Validates the provided reCAPTCHA token by sending a request to the Google reCAPTCHA verification URL.
 *
 * @param {string} recaptchaToken - The reCAPTCHA token to be validated.
 * @returns {Promise<any>} - A promise that resolves to the response from the Google reCAPTCHA verification service.
 * @throws {Error} - Throws an error if the required environment variables are missing.
 */
export default async function validateCaptcha(recaptchaToken: string) {
  let verificationUrl = SIGN_UP.CAPTCHA_URL || 'https://www.google.com/recaptcha/api/siteverify';
  const secret = process.env.GOOGLE_SECRET_KEY;

  if (!verificationUrl || !secret) {
    throw new Error('Missing environment variables for reCAPTCHA.');
  }

  verificationUrl = verificationUrl + `?secret=${secret}&response=${recaptchaToken}`;

  const verificationResponse = await fetch(verificationUrl, { method: 'POST' });

  const response = await verificationResponse.json();
  return response;
}

/**
 * Retrieves the reCAPTCHA token using the Google reCAPTCHA service.
 *
 * @returns {Promise<{ token?: string; error?: Error }>} A promise that resolves to an object containing the reCAPTCHA token or an error.
 *
 * @throws {Error} If reCAPTCHA is not available or the site key is missing.
 *
 */
export const getRecaptchaToken = async () => {
  try {
    const siteKey = process.env.GOOGLE_SITE_KEY;

    if (typeof window !== 'undefined' && siteKey) {
      const token = await window?.grecaptcha?.execute(siteKey, { action: 'submit' });
      return { token };
    } else {
      throw new Error('reCAPTCHA is not available or missing site key.');
    }
  } catch (error) {
    return { error };
  }
};
