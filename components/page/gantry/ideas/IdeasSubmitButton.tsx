import s from './Ideas.module.scss';

interface Props {
  readonly onClick: () => void;
  readonly className?: string;
  readonly label?: string;
  readonly hasDraft?: boolean;
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

function PencilIcon() {
  return (
    <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12.75 2.25a1.5 1.5 0 0 1 2.121 0l.879.879a1.5 1.5 0 0 1 0 2.121l-9 9L3 15l.75-3.75 9-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IdeasSubmitButton({ onClick, className, label = 'Share a need', hasDraft = false }: Props) {
  return (
    <button type="button" className={className ?? s.submitButton} onClick={onClick}>
      {hasDraft ? <PencilIcon /> : <PlusIcon />}
      {hasDraft ? 'Resume draft' : label}
    </button>
  );
}
