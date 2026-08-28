const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmailAddress = (value: string) => EMAIL_RE.test(value);
