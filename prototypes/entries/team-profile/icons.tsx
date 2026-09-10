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
