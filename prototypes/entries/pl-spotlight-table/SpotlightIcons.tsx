// Icons exported from the Figma frame (node 750:690) and inlined verbatim —
// same viewBox, same path data, same baked-in stroke colors.
//
// They live in this file rather than /public because a prototype may not write
// outside prototypes/ (prototypes/CLAUDE.md #1) and the Figma asset URLs expire
// after ~7 days. Nothing here is hand-drawn; each path is the exported bytes.
//
// The Send/Resend variants of the invite and follow-up icons are byte-identical
// in the frame, so there is one component per glyph, not per button state.

type IconProps = { className?: string };

/** Icon 96e2ad2c — Invite Accepted, true. 20×20, stroke #22C55E. */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.16667 10.8333L7.5 14.1667L15.8333 5.83333"
        stroke="#22C55E"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon 4453c3c1 — Invite Accepted, false. 20×20, stroke #EF4444. */
export function CrossIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 15L15 5M5 5L15 15"
        stroke="#EF4444"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon b8ac442c — the arrow beside a Team link. 16×16, fill/stroke #156FF7. */
export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12.5003 4V10.5C12.5003 10.6326 12.4476 10.7598 12.3538 10.8536C12.2601 10.9473 12.1329 11 12.0003 11C11.8677 11 11.7405 10.9473 11.6467 10.8536C11.553 10.7598 11.5003 10.6326 11.5003 10.5V5.20687L4.35403 12.3538C4.26021 12.4476 4.13296 12.5003 4.00028 12.5003C3.8676 12.5003 3.74035 12.4476 3.64653 12.3538C3.55271 12.2599 3.5 12.1327 3.5 12C3.5 11.8673 3.55271 11.7401 3.64653 11.6462L10.7934 4.5H5.50028C5.36767 4.5 5.24049 4.44732 5.14672 4.35355C5.05296 4.25979 5.00028 4.13261 5.00028 4C5.00028 3.86739 5.05296 3.74021 5.14672 3.64645C5.24049 3.55268 5.36767 3.5 5.50028 3.5H12.0003C12.1329 3.5 12.2601 3.55268 12.3538 3.64645C12.4476 3.74021 12.5003 3.86739 12.5003 4Z"
        fill="#156FF7"
        stroke="#156FF7"
      />
    </svg>
  );
}

/** Icon 664084da — Send / Resend Invite. 16×16, stroke #156FF7. */
export function EnvelopeIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 5.33333L7.26 8.84C7.47911 8.98619 7.7366 9.0642 8 9.0642C8.2634 9.0642 8.52089 8.98619 8.74 8.84L14 5.33333M3.33333 12.6667H12.6667C13.0203 12.6667 13.3594 12.5262 13.6095 12.2761C13.8595 12.0261 14 11.687 14 11.3333V4.66667C14 4.31304 13.8595 3.97391 13.6095 3.72386C13.3594 3.47381 13.0203 3.33333 12.6667 3.33333H3.33333C2.97971 3.33333 2.64057 3.47381 2.39052 3.72386C2.14048 3.97391 2 4.31304 2 4.66667V11.3333C2 11.687 2.14048 12.0261 2.39052 12.2761C2.64057 12.5262 2.97971 12.6667 3.33333 12.6667Z"
        stroke="#156FF7"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon 04af2d8e — Send / Resend Follow-up. 16×16, stroke #7C3AED. */
export function ReplyIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 6.66667H8.66667C10.0812 6.66667 11.4377 7.22857 12.4379 8.22876C13.4381 9.22896 14 10.5855 14 12V13.3333M6 2.66667L2 6.66667L6 10.6667"
        stroke="#7C3AED"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon ba1a3e0f — Remove participant. 16×16, stroke #DC2626. */
export function TrashIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M12.6667 4.66667L12.0887 12.7613C12.0647 13.0977 11.9142 13.4125 11.6674 13.6424C11.4206 13.8722 11.0959 14 10.7587 14H5.24133C4.90409 14 4.57938 13.8722 4.33259 13.6424C4.0858 13.4125 3.93528 13.0977 3.91133 12.7613L3.33333 4.66667M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333M10 4.66667V2.66667C10 2.48986 9.92976 2.32029 9.80474 2.19526C9.67971 2.07024 9.51014 2 9.33333 2H6.66667C6.48986 2 6.32029 2.07024 6.19526 2.19526C6.07024 2.32029 6 2.48986 6 2.66667V4.66667M2.66667 4.66667H13.3333"
        stroke="#DC2626"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icons 25cd95a1 / b8012a2d — the select chevron. 10×6, identical geometry;
 * only the stroke differs (#6B21A8 on the purple Type pill, #1E40AF on the blue
 * Access pill), so it is passed in rather than duplicated.
 */
export function ChevronDownIcon({ className, stroke }: IconProps & { stroke: string }) {
  return (
    <svg className={className} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1L5 5L9 1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
