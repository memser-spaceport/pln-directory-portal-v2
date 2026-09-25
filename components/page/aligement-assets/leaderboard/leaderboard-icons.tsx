/**
 * The design calls Phosphor icon classes (`ph-fill ph-trophy`). This app does
 * not load the Phosphor webfont, so the same glyphs ship as inline SVG rather
 * than pulling in an icon dependency for seven marks.
 */
interface IconProps {
  readonly size?: number;
  readonly color?: string;
  readonly className?: string;
}

const base = ({ size = 16, color = 'currentColor' }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 256 256',
  fill: color,
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: false as const,
});

export function RankingIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M232 208h-16V72a16 16 0 0 0-16-16h-40a16 16 0 0 0-16 16v40h-32a16 16 0 0 0-16 16v40H64a16 16 0 0 0-16 16v24H24a8 8 0 0 0 0 16h208a8 8 0 0 0 0-16ZM160 72h40v136h-40Zm-48 56h32v80h-32ZM64 184h32v24H64Z" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M232 64h-32V48a8 8 0 0 0-8-8H64a8 8 0 0 0-8 8v16H24a8 8 0 0 0-8 8v24a40 40 0 0 0 40 40h5a88.2 88.2 0 0 0 59 55.6V216H88a8 8 0 0 0 0 16h80a8 8 0 0 0 0-16h-32v-24.4A88.2 88.2 0 0 0 195 136h5a40 40 0 0 0 40-40V72a8 8 0 0 0-8-8ZM56 120a24 24 0 0 1-24-24V80h24Zm168-24a24 24 0 0 1-24 24V80h24Z" />
    </svg>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M184 89.6V88c0-27.6-42.5-48-96-48S-8 60.4-8 88v32c0 20.8 24.1 37.6 60 44.8V168c0 27.6 42.5 48 96 48s96-20.4 96-48v-32c0-20.6-23.7-37.4-60-44.4ZM224 136c0 13.4-30.6 32-80 32-4.5 0-9-.2-13.3-.5C162 159.7 184 145 184 128v-21.9c25.7 6 40 17.8 40 29.9Z" />
    </svg>
  );
}

export function UsersThreeIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M244.8 150.4a8 8 0 0 1-11.2-1.6A51.6 51.6 0 0 0 192 128a8 8 0 0 1 0-16 24 24 0 1 0-23.2-30 8 8 0 0 1-15.5-4A40 40 0 1 1 219 117.5a67.9 67.9 0 0 1 27.4 21.7 8 8 0 0 1-1.6 11.2ZM190.9 214a8 8 0 0 1-3 10.9 8 8 0 0 1-10.9-3 57 57 0 0 0-98 0 8 8 0 1 1-13.9-8 72.5 72.5 0 0 1 33.7-30.5 44 44 0 1 1 58.4 0 72.5 72.5 0 0 1 33.7 30.6ZM64 120a8 8 0 0 0-8-8 24 24 0 1 1 23.2-30 8 8 0 0 0 15.5-4A40 40 0 1 0 37 117.5a67.9 67.9 0 0 0-27.4 21.7 8 8 0 1 0 12.8 9.6A51.6 51.6 0 0 1 64 128a8 8 0 0 0 8-8Z" />
    </svg>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M215.8 118.2A8 8 0 0 0 208 112h-56.9l18.2-89.6a8 8 0 0 0-13.6-7L40.3 136.4a8 8 0 0 0 5.7 13.6h56.9l-18.2 89.6a8 8 0 0 0 13.6 7l115.4-121a8 8 0 0 0 2.1-7.4Z" />
    </svg>
  );
}

export function ArrowsClockwiseIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M240 56v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.7l-14.4-13.2a79.9 79.9 0 0 0-134 35.2 8 8 0 1 1-15.4-4.2A95.9 95.9 0 0 1 209.4 71.6L224 85.1V56a8 8 0 0 1 16 0ZM203 152.3a8 8 0 0 0-9.8 5.6 79.9 79.9 0 0 1-134 35.2L44.7 180H72a8 8 0 0 0 0-16H24a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-29.1l14.6 13.5A95.9 95.9 0 0 0 208.6 162a8 8 0 0 0-5.6-9.7Z" />
    </svg>
  );
}

export function CaretLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M163.7 216a8 8 0 0 1-5.7-2.3l-80-80a8 8 0 0 1 0-11.4l80-80a8 8 0 0 1 11.4 11.4L95.3 128l74.1 74.3a8 8 0 0 1-5.7 13.7Z" />
    </svg>
  );
}

export function CaretRightIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M92.3 216a8 8 0 0 1-5.7-13.7l74.1-74.3-74.1-74.3a8 8 0 0 1 11.4-11.4l80 80a8 8 0 0 1 0 11.4l-80 80a8 8 0 0 1-5.7 2.3Z" />
    </svg>
  );
}

export function TrendIcon({ up, ...props }: IconProps & { readonly up: boolean }) {
  return (
    <svg {...base(props)} className={props.className}>
      {up ? (
        <path d="M232 56v64a8 8 0 0 1-16 0V75.3l-74.3 74.4a8 8 0 0 1-11.4 0L96 115.3l-58.3 58.4a8 8 0 0 1-11.4-11.4l64-64a8 8 0 0 1 11.4 0L136 132.7 204.7 64H160a8 8 0 0 1 0-16h64a8 8 0 0 1 8 8Z" />
      ) : (
        <path d="M232 136v64a8 8 0 0 1-8 8h-64a8 8 0 0 1 0-16h44.7L136 123.3l-34.3 34.4a8 8 0 0 1-11.4 0l-64-64a8 8 0 0 1 11.4-11.4L96 140.7l34.3-34.4a8 8 0 0 1 11.4 0L216 180.7V136a8 8 0 0 1 16 0Z" />
      )}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M221.7 133.7l-72 72a8 8 0 0 1-11.4-11.4L196.7 136H40a8 8 0 0 1 0-16h156.7l-58.4-58.3a8 8 0 0 1 11.4-11.4l72 72a8 8 0 0 1 0 11.4Z" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)} className={props.className}>
      <path d="M239.2 97.3a16 16 0 0 0-13.8-11l-58.2-5-22.7-53.6a16 16 0 0 0-29 0L92.8 81.3l-58.2 5a16 16 0 0 0-9.1 28.1l44.1 38.2-13.2 57a16 16 0 0 0 23.8 17.3l50-30.1 50 30.1a16 16 0 0 0 23.8-17.3l-13.2-57 44.1-38.2a16 16 0 0 0 4.3-16.8Z" />
    </svg>
  );
}
