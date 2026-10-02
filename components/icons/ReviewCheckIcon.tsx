import type { SVGProps } from 'react';

/**
 * The reviewed mark — one drawing in three states, so a list row and the bar
 * above the pane can never disagree about what "reviewed" looks like.
 *
 *   outline — a 1px ring and a thin check in `currentColor`: the press at rest.
 *             Todoist, Asana and Adaline all draw an undone "done" as an
 *             outline; a filled disc before anything is done reads as a blob.
 *   filled  — the ring fills and the check turns white: the press once on.
 *   bare    — Phosphor's check alone, no disc: the list row's mark beside the
 *             name. A ring around a glyph is a button shape, and on the row
 *             this is a fact, not a press.
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
}: { size?: number; state?: 'outline' | 'filled' | 'bare' } & SVGProps<SVGSVGElement>) {
  const check = 'M5.25 8.25L7.1 10L10.75 6.25';
  const named = !!rest['aria-label'];

  if (state === 'bare') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={named ? undefined : 'true'}
        {...rest}
      >
        <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
      </svg>
    );
  }

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
