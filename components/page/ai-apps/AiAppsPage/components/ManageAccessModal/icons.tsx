/** 16px stroke icons matching the AI Apps actions menu set; they inherit `currentColor`. */
const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12" />
      <path d="M8 2c1.6 1.7 2.4 3.7 2.4 6S9.6 12.3 8 14c-1.6-1.7-2.4-3.7-2.4-6S6.4 3.7 8 2Z" />
    </svg>
  );
}
