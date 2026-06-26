import { SVGProps } from 'react';

// Matches the production link-with-arrow used in the investors area
// (OutreachInvestorTable's "{name} ↗" mark): a clean stroke arrow, not the
// filled @/components/icons ArrowUpRightIcon. Kept local so it tracks that.
export function ArrowUpRightIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
