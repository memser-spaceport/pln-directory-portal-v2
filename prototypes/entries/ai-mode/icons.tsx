/**
 * Glyphs the rail needs that `@/components/icons` doesn't have. Each is a
 * 1.5px stroke taking `currentColor` at 16px — the weight of `CloseIcon` and
 * the other DS line icons — so tone lives in CSS.
 *
 *  - Plus: production's `/icons/add.svg` geometry (the bare cross on "New
 *    Conversation"), not the DS `PlusIcon`, which is a plus in a circle — a
 *    button shape, and the row is already the button.
 *  - Panel: production draws the rail toggle as `/icons/sidenav-close.svg`, a
 *    filled bar-and-arrow; redrawn as a stroked panel so it sits at the same
 *    weight as the plus and the clock beside it.
 *  - Clock: `/icons/history.svg`'s drawing (arrow-circle clock) as a stroke.
 *  - Trash: `/icons/delete-icon.svg`'s paths, with its orange baked-in stroke
 *    handed back to `currentColor`; red is for the confirm, not the row.
 */
type P = { size?: number };

export function PlusGlyph({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.66 8H2.34M8 13.66V2.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PanelGlyph({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.25" width="12.5" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ClockGlyph({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 8a5.5 5.5 0 1 0 1.61-3.89M2.5 2.75v2.5H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.25V8l1.9 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashGlyph({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 16" fill="none" aria-hidden="true">
      <path
        d="M4 3.29 4.7 13.29a.75.75 0 0 0 .75.71h6.1a.75.75 0 0 0 .75-.71L13 3.29M8.5 7.12v3.06M14.5 3.29h-12M5.88 3.29l.4-1.25A1.5 1.5 0 0 1 7.7 1h1.6a1.5 1.5 0 0 1 1.42 1.04l.4 1.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
