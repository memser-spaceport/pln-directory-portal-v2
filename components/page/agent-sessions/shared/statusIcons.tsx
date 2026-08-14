/**
 * Hand-rolled inline SVGs, matching how the rest of this codebase does icons —
 * there is no icon package installed. All stroke `currentColor`, so a badge's tone
 * class colours the icon along with its text.
 */
import type { SVGProps } from 'react';

interface IconProps {
  readonly className?: string;
}

// Annotated rather than inferred: without it `focusable` widens to `string` and
// `strokeLinecap` to `string`, neither of which satisfies SVGProps.
const BASE: SVGProps<SVGSVGElement> = {
  width: 12,
  height: 12,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

/** Open arc — reads as motion once the spin class is applied. */
export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5 8.25 7.25 10.5 11 6" />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.75V8.5" />
      <path d="M8 11.25h.01" />
    </svg>
  );
}

export function SlashIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M3.75 3.75l8.5 8.5" />
    </svg>
  );
}

export function QuestionIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6.25 6.25a1.75 1.75 0 1 1 2.4 1.63c-.4.16-.65.55-.65.98v.24" />
      <path d="M8 11.5h.01" />
    </svg>
  );
}

export function PullRequestIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="4.5" cy="4" r="1.75" />
      <circle cx="4.5" cy="12" r="1.75" />
      <path d="M4.5 5.75v4.5" />
      <circle cx="11.5" cy="12" r="1.75" />
      <path d="M11.5 10.25V6.5a2 2 0 0 0-2-2H7.5" />
      <path d="M9 2.75 7.25 4.5 9 6.25" />
    </svg>
  );
}

export function MergeIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="4.5" cy="3.5" r="1.75" />
      <circle cx="4.5" cy="12.5" r="1.75" />
      <circle cx="11.5" cy="8" r="1.75" />
      <path d="M4.5 5.25v5.5" />
      <path d="M6.25 8h3.5" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M2.75 4.25h10.5" />
      <path d="M6.25 4.25V3a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v1.25" />
      <path d="M4.25 4.25v8.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75v-8.5" />
    </svg>
  );
}
