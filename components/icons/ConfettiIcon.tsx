import React, { SVGProps } from 'react';

export function ConfettiIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4.00001 28L7.81201 16.56C8.01601 15.948 8.45201 15.444 9.02601 15.148C9.60001 14.852 10.264 14.788 10.882 14.968L14.4 16L17.6 6.40001C17.7936 5.81977 18.2018 5.33743 18.7421 5.05128C19.2824 4.76513 19.9119 4.69699 20.5 4.86201L26 6.50001"
        stroke="#1B4DFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12L14 4" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 14L28 12" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10V4" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 16V10" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
