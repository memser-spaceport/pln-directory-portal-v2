
declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default async function validateCaptcha(recaptchaToken: string) {
  const verificationUrl = process.env.GOOGLE_RECAPTCHA_VERIFICATION_URL;
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET;

  if (!verificationUrl || !secret) {
    throw new Error("Missing environment variables for reCAPTCHA.");
  }

  const recaptchaResponse = await fetch(verificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `secret=${secret}&response=${recaptchaToken}`,
  });

  const response = await recaptchaResponse.json();
  return response;
}

export const getRecaptchaToken = async () => {
  try {
    const siteKey = process.env.GOOGLE_RECAPTCHA_KEY;

    if (typeof window !== "undefined" && siteKey) {
      const token = await window?.grecaptcha?.execute(siteKey, { action: "submit" });
      return { token };
    } else {
      throw new Error("reCAPTCHA is not available or missing site key.");
    }
  } catch (error) {
    return { error };
  }
};
