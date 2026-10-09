import React, { SVGProps } from 'react';

export function ShareIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.7 10.7 6.6-4.4m-6.6 7.4 6.6 4.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
