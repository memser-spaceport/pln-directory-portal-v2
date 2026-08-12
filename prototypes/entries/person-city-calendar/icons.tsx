/* Icons for the person-city-calendar prototype.
   LocationIcon is transcribed verbatim from components/page/members/member-grid-view.tsx:188
   so the at-home label is pixel-identical to the production card; only `fill` is
   parameterised so the same glyph can sit on a tinted band. */

export const LocationIcon = ({ fill = '#455468' }: { fill?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 4C7.50555 4 7.0222 4.14662 6.61107 4.42133C6.19995 4.69603 5.87952 5.08648 5.6903 5.54329C5.50108 6.00011 5.45157 6.50277 5.54804 6.98773C5.6445 7.47268 5.8826 7.91814 6.23223 8.26777C6.58186 8.6174 7.02732 8.8555 7.51227 8.95196C7.99723 9.04843 8.49989 8.99892 8.95671 8.8097C9.41352 8.62048 9.80397 8.30005 10.0787 7.88893C10.3534 7.4778 10.5 6.99445 10.5 6.5C10.5 5.83696 10.2366 5.20107 9.76777 4.73223C9.29893 4.26339 8.66304 4 8 4ZM8 8C7.70333 8 7.41332 7.91203 7.16664 7.7472C6.91997 7.58238 6.72771 7.34811 6.61418 7.07403C6.50065 6.79994 6.47094 6.49834 6.52882 6.20736C6.5867 5.91639 6.72956 5.64912 6.93934 5.43934C7.14912 5.22956 7.41639 5.0867 7.70736 5.02882C7.99834 4.97094 8.29994 5.00065 8.57403 5.11418C8.84811 5.22771 9.08238 5.41997 9.2472 5.66664C9.41203 5.91332 9.5 6.20333 9.5 6.5C9.5 6.89782 9.34196 7.27936 9.06066 7.56066C8.77936 7.84196 8.39782 8 8 8ZM8 1C6.54182 1.00165 5.14383 1.58165 4.11274 2.61274C3.08165 3.64383 2.50165 5.04182 2.5 6.5C2.5 8.4625 3.40688 10.5425 5.125 12.5156C5.89701 13.4072 6.76591 14.2101 7.71562 14.9094C7.7997 14.9683 7.89985 14.9999 8.0025 14.9999C8.10515 14.9999 8.20531 14.9683 8.28938 14.9094C9.23734 14.2098 10.1046 13.4069 10.875 12.5156C12.5906 10.5425 13.5 8.4625 13.5 6.5C13.4983 5.04182 12.9184 3.64383 11.8873 2.61274C10.8562 1.58165 9.45818 1.00165 8 1ZM8 13.875C6.96688 13.0625 3.5 10.0781 3.5 6.5C3.5 5.30653 3.97411 4.16193 4.81802 3.31802C5.66193 2.47411 6.80653 2 8 2C9.19347 2 10.3381 2.47411 11.182 3.31802C12.0259 4.16193 12.5 5.30653 12.5 6.5C12.5 10.0769 9.03312 13.0625 8 13.875Z"
      fill={fill}
    />
  </svg>
);

/* The travel glyph. This is the load-bearing part of the label: swapping the
   city text alone would read as "Theo moved to Berlin" — the plane is what says
   the state is temporary. Drawn to sit on the same 16px box as LocationIcon. */
/**
 * Paper plane. Straight lines only — the previous path was a hand-drawn
 * side-on airliner whose curves collapsed into a blob below ~16px, which is
 * every place it is actually used. There is no plane in production
 * (`public/icons` has none, and the "send" SVGs are stroke-only with baked-in
 * colours and 29x30 boxes), so this is drawn here rather than reused.
 *
 * Four points on a 16 box: tip (14.9,1.1) → tail (1.6,6.5) → fold (7.2,8.7) →
 * base (9.4,14.3).
 */
export const PlaneIcon = ({ fill = '#1B4DFF', size = 16 }: { fill?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.9 1.1 1.6 6.5l5.6 2.2 2.2 5.6L14.9 1.1Z" fill={fill} />
  </svg>
);

export const CalendarIcon = ({ fill = '#455468' }: { fill?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 2.5h-1.5V2a.5.5 0 0 0-1 0v.5h-5V2a.5.5 0 0 0-1 0v.5H3a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3.5a1 1 0 0 0-1-1Zm0 10.5H3V6h10v7ZM13 5H3V3.5h1.5V4a.5.5 0 0 0 1 0v-.5h5V4a.5.5 0 0 0 1 0v-.5H13V5Z"
      fill={fill}
    />
  </svg>
);

export const CheckIcon = ({ fill = '#0A9952' }: { fill?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.7 4.3a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3A.75.75 0 0 1 4.2 7.8l2.47 2.47 5.97-5.97a.75.75 0 0 1 1.06 0Z"
      fill={fill}
    />
  </svg>
);

export const TrashIcon = ({ fill = '#8897AE' }: { fill?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 3.5h-2.5V3a1.5 1.5 0 0 0-1.5-1.5H7A1.5 1.5 0 0 0 5.5 3v.5H3a.5.5 0 0 0 0 1h.5V13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5h.5a.5.5 0 0 0 0-1ZM6.5 3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v.5h-3V3Zm5 10h-7V4.5h7V13ZM7 6.5v4.5a.5.5 0 0 1-1 0V6.5a.5.5 0 0 1 1 0Zm3 0v4.5a.5.5 0 0 1-1 0V6.5a.5.5 0 0 1 1 0Z"
      fill={fill}
    />
  </svg>
);

export const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronIcon = ({ direction = 'down' }: { direction?: 'down' | 'left' | 'right' }) => {
  const rotate = direction === 'left' ? 90 : direction === 'right' ? -90 : 0;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
