import React, { SVGProps } from 'react';

export function TrashIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3.5 3.29 4.2 13.29a.8.8 0 0 0 .75.71h6.1a.8.8 0 0 0 .75-.71L12.5 3.29M8 7.12v3.06M14 3.29H2m3.38 0 .4-1.25a.8.8 0 0 1 .76-.54h2.92c.35 0 .65.22.76.54l.4 1.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
