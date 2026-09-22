import type { SVGProps } from 'react';

/**
 * The reviewed mark — one drawing in three states, so a list row and the bar
 * above the pane can never disagree about what "reviewed" looks like.
 *
 *   outline — a 1px ring and a thin check in `currentColor`: the press at rest.
 *             Todoist, Asana and Adaline all draw an undone "done" as an
 *             outline; a filled disc before anything is done reads as a blob.
 *   filled  — the ring fills and the check turns white: the press once on.
 *   soft    — a pale tint disc with the check in `currentColor`: the list
 *             row's mark. Quiet enough to sit beside the grey clock without
 *             being the loudest thing on the row.
 *
 * Weights follow the row's clock (Phosphor regular, a 1px ring at 16px), not
 * `SuccessCircleIcon`, which is a solid fill and heavier than every glyph
 * around it.
 *
 * `aria-hidden` is defaulted rather than hard-coded, so a caller that needs the
 * glyph to carry a name (the list row, where the tick is the only thing saying
 * "reviewed") can pass `aria-label` and have it work. Hard-coding it meant a
 * labelled icon was still hidden from the people the label was for.
 */
export function ReviewCheckIcon({
  size = 16,
  state = 'outline',
  ...rest
}: { size?: number; state?: 'outline' | 'filled' | 'soft' } & SVGProps<SVGSVGElement>) {
  const check = 'M5.25 8.25L7.1 10L10.75 6.25';
  const named = !!rest['aria-label'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={named ? undefined : 'true'}
      {...rest}
    >
      {state === 'outline' && <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />}
      {state === 'filled' && <circle cx="8" cy="8" r="7" fill="currentColor" />}
      {state === 'soft' && (
        <circle cx="8" cy="8" r="8" fill="var(--background-success-subtle, rgba(10, 153, 82, 0.08))" />
      )}
      <path
        d={check}
        stroke={state === 'filled' ? '#fff' : 'currentColor'}
        strokeWidth={state === 'outline' ? 1.25 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
