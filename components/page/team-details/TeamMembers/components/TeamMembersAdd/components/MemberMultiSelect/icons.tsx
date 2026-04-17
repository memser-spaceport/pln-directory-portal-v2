import { CSSProperties } from 'react';

interface Props {
  className?: string;
  style?: CSSProperties;
}

export function SearchIcon(props: Props) {
  const { className } = props;

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333ZM17.5 17.5l-3.625-3.625"
        stroke="#8897AE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowDownIcon(props: Props) {
  const { style, className } = props;

  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M4 6l4 4 4-4" stroke="#8897AE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
