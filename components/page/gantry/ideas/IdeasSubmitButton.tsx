import s from './Ideas.module.scss';

interface Props {
  readonly onClick: () => void;
  readonly className?: string;
  readonly label?: string;
}

function PlusIcon() {
  return (
    <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M9 3.75V14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 9H14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IdeasSubmitButton({ onClick, className, label = 'Submit an Idea' }: Props) {
  return (
    <button type="button" className={className ?? s.submitButton} onClick={onClick}>
      <PlusIcon />
      {label}
    </button>
  );
}
