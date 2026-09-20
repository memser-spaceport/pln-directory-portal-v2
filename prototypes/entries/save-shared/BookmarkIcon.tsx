/**
 * The bookmark, in the two states a save control takes.
 *
 * Not the design system's `BookmarkIcon` / `BookmarkIconFilled`. Those are the
 * Demo Day team card's Save button and they are correct there — but both bake
 * `fill="#1B4DFF"` into the path and wrap it in a Figma drop-shadow filter with a
 * fixed id, so they cannot take the row's grey at rest, cannot be recoloured by
 * the control's own `color`, and duplicate a DOM id the moment two rows render.
 * This is the same silhouette (a 2:1 tag with a notch), drawn the way this
 * product's other meta-row glyphs are drawn — `currentColor`, outlined at the
 * forum icons' stroke, filled when active — so the button's colour does the work.
 *
 * One drawing for both surfaces, sized a step above the share glyph beside it
 * (row 18px vs 14px, feed 20px vs 16px): the bookmark is a narrow tag that
 * reads small at the same box size. The host passes the size and the mark
 * scales, so the bookmark holds its weight beside the control on either surface.
 */
export function BookmarkGlyph({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 2.6h8c.33 0 .6.27.6.6v10.2L8 10.55 3.4 13.4V3.2c0-.33.27-.6.6-.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
