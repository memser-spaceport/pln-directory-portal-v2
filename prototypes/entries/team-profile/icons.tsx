import type { SVGProps } from 'react';

/**
 * The plus a creation door wears — `DealsToolbar`'s submit-button glyph,
 * verbatim (it is drawn inline there, not exported): a bare 1.5px stroked
 * cross. Not the DS `PlusIcon`, which is a plus in a circle and belongs to
 * production's pickers and tag inputs, not to its "add a thing" buttons.
 *
 * One drawing for both of this page's doors — Post news and Submit a job — so
 * the two cannot drift. Sized by the slot: 14px in a section header's action
 * (the Edit icon's size), 12px inside an `xxs` button's 16px line box.
 */
export function SubmitPlusIcon({ size = 14, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...rest}
    >
      <path d="M9 3.75V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The product's envelope — `public/icons/email.svg`, the glyph the settings
 * menu and the contact rows use — transcribed so it can take `currentColor`:
 * the file bakes in `#455468`, and on the applicants page it sits inside the
 * filled primary button, where the text is white.
 */
export function EnvelopeIcon({ size = 14, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...rest}>
      <path
        d="M14 3H2C1.86739 3 1.74021 3.05268 1.64645 3.14645C1.55268 3.24021 1.5 3.36739 1.5 3.5V12C1.5 12.2652 1.60536 12.5196 1.79289 12.7071C1.98043 12.8946 2.23478 13 2.5 13H13.5C13.7652 13 14.0196 12.8946 14.2071 12.7071C14.3946 12.5196 14.5 12.2652 14.5 12V3.5C14.5 3.36739 14.4473 3.24021 14.3536 3.14645C14.2598 3.05268 14.1326 3 14 3ZM12.7144 4L8 8.32187L3.28562 4H12.7144ZM13.5 12H2.5V4.63688L7.66187 9.36875C7.75412 9.45343 7.87478 9.50041 8 9.50041C8.12522 9.50041 8.24588 9.45343 8.33813 9.36875L13.5 4.63688V12Z"
        fill="currentColor"
      />
    </svg>
  );
}
