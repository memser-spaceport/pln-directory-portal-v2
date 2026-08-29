'use client';

interface ChevronIconProps {
  expanded: boolean;
  size?: number;
  direction?: 'horizontal' | 'vertical';
}

export default function ChevronIcon({ expanded, size = 11, direction = 'vertical' }: ChevronIconProps) {
  const path = direction === 'horizontal' ? 'M9 6l6 6-6 6' : 'M6 9l6 6 6-6';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}
    >
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
