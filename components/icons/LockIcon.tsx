import { SVGProps } from 'react';

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="2.75" y="6.25" width="10.5" height="8" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.25 6.25V4.5a2.75 2.75 0 0 1 5.5 0v1.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
