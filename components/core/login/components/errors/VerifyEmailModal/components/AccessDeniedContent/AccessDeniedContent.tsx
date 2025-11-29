import { WarningIcon } from './components/WarningIcon';

import s from './AccessDeniedContent.module.scss';

interface Props {
  errorMessage: string;
  description: string;
  onClose: () => void;
  onRequestInvite: () => void;
}

export function AccessDeniedContent(props: Props) {
  const { errorMessage, description, onClose, onRequestInvite } = props;

  return (
    <div className={s.accessDeniedWrapper}>
      <button onClick={onClose} className={s.closeButton} data-testid="close-button">
        <img width={22} height={22} src="/icons/close.svg" alt="close" />
      </button>
      <div className={s.icon}>
        <WarningIcon />
      </div>
      <div className={s.description}>{errorMessage}</div>
      <a href={description} className={s.cta} target="_blank" rel="noopener noreferrer" onClick={onRequestInvite}>
        Register
      </a>
    </div>
  );
}
