import { SVGProps } from 'react';

export const InfoCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9.75 12.75H8.25V11.25H9.75V12.75ZM9.75 9.75H8.25V5.25H9.75V9.75Z"
      fill="#1B4DFF"
    />
  </svg>
);

export const PlusSmIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M7 3.28125V10.7188M3.28125 7H10.7188"
      stroke="#1B4DFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseSmIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M10.2812 3.71875L3.71875 10.2812M3.71875 3.71875L10.2812 10.2812"
      stroke="#1B4DFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
