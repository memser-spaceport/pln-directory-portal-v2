/**
 * Transcribed verbatim from the Demo Day "Make an intro" modal's local EnvelopeIcon
 * (ReferCompanyModal.tsx) — same 32px glyph, same hardcoded brand fill. It isn't
 * exported there, so this is a copy rather than an import.
 */
export const EnvelopeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M28 6H4C3.73478 6 3.48043 6.10536 3.29289 6.29289C3.10536 6.48043 3 6.73478 3 7V24C3 24.5304 3.21071 25.0391 3.58579 25.4142C3.96086 25.7893 4.46957 26 5 26H27C27.5304 26 28.0391 25.7893 28.4142 25.4142C28.7893 25.0391 29 24.5304 29 24V7C29 6.73478 28.8946 6.48043 28.7071 6.29289C28.5196 6.10536 28.2652 6 28 6ZM27 24H5V9.27375L15.3237 18.7375C15.5082 18.9069 15.7496 19.0008 16 19.0008C16.2504 19.0008 16.4918 18.9069 16.6763 18.7375L27 9.27375V24Z"
      fill="#1B4DFF"
    />
  </svg>
);

/** Local icons for the referral flow. Sized to inherit `currentColor` like the
 *  production jobs icons (ReferRoleRow/components/Icons.tsx). */
export const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 4.5 8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
