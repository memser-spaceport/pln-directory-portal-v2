import type { SVGProps } from 'react';

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

/**
 * The bare plus — the refer modal's "adds something" mark, in the outside-network
 * menu row, the suggestion chips and the field's own "Add someone else" line.
 *
 * **Not the DS `PlusIcon`, which is circled.** That glyph has exactly one home in
 * production: `MobileFilterButton` / `MobileFilterWrapper`, the mobile "＋ Filters"
 * control. Every add glyph *inside a field* — `FormTagsInput`, `TagsInput`,
 * `FilterTagInput`, `SkillsTagsInput` — hand-rolls this bare one instead, and that
 * is the lineage the refer modal's marks belong to: a ring around a plus reads as a
 * button in its own right, which is wrong on a chip that is already a button and on
 * a menu row that is already a row.
 *
 * Geometry is those four files' path verbatim. The one deviation: they hardcode
 * `fill="#8897AE"`, and these marks are brand blue on the chips, so the fill is
 * handed back to `currentColor` and the tone stays in CSS.
 */
export const PlusIcon = (props?: SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M14.25 8C14.25 8.19891 14.171 8.38968 14.0303 8.53033C13.8897 8.67098 13.6989 8.75 13.5 8.75H8.75V13.5C8.75 13.6989 8.67098 13.8897 8.53033 14.0303C8.38968 14.171 8.19891 14.25 8 14.25C7.80109 14.25 7.61032 14.171 7.46967 14.0303C7.32902 13.8897 7.25 13.6989 7.25 13.5V8.75H2.5C2.30109 8.75 2.11032 8.67098 1.96967 8.53033C1.82902 8.38968 1.75 8.19891 1.75 8C1.75 7.80109 1.82902 7.61032 1.96967 7.46967C2.11032 7.32902 2.30109 7.25 2.5 7.25H7.25V2.5C7.25 2.30109 7.32902 2.11032 7.46967 1.96967C7.61032 1.82902 7.80109 1.75 8 1.75C8.19891 1.75 8.38968 1.82902 8.53033 1.96967C8.67098 2.11032 8.75 2.30109 8.75 2.5V7.25H13.5C13.6989 7.25 13.8897 7.32902 14.0303 7.46967C14.171 7.61032 14.25 7.80109 14.25 8Z"
      fill="currentColor"
    />
  </svg>
);
