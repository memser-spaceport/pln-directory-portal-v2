import { SVGProps } from 'react';

interface Props extends SVGProps<SVGSVGElement> {
  readonly filled?: boolean;
}

/** Thumbs-up like icon used in founder guides and forum. */
export function LikeThumbsIcon({ filled = false, ...props }: Props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path
        d="M5 14V7.5L7.5 2.5C8.052 2.5 8.5 2.948 8.5 3.5V5.5H12C12.552 5.5 13 5.948 13 6.5L11.5 11V13C11.5 13.552 11.052 14 10.5 14H5M5 14H3C2.448 14 2 13.552 2 13V8C2 7.448 2.448 7 3 7H5"
        stroke={filled ? '#1b4dff' : '#8897ae'}
        fill={filled ? 'rgba(27, 77, 255, 0.12)' : 'none'}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
