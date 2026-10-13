/**
 * The intro mark: an outlined envelope. It began as the Demo Day "Make an
 * intro" modal's own filled envelope (`ReferCompanyModal.tsx`) and was made
 * outlined on 2026-09-24 ("Make letter icon outlined"): on a bordered grey
 * button beside a filled one, a solid glyph was the heaviest ink on the
 * lighter control. Drawn on the DS icon grid (16 viewBox, round joins). The
 * stroke is 1.25, a step under `CloseIcon`'s 1.5 ("Make icon thinner", once
 * the button's glyph went to 16px: at 1.5 the envelope read heavier than the
 * 14px label beside it). One glyph for one door — the request button on the profiles, the row
 * action in search and the modal's masthead all wear it — and it takes
 * `currentColor` so each host sets the tone in CSS.
 */
export function EnvelopeGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.25 4.25 8 8.75l5.75-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
