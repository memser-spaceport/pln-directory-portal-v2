import s from '@/components/core/login/components/errors/VerifyEmailModal/VerifyEmailModal.module.scss';

interface Props {
  title: string;
  errorMessage: string;
  description: string;
  onClose: () => void;
}

export function RegularContent(props: Props): JSX.Element {
  const { title, errorMessage, description, onClose } = props;

  return (
    <>
      <div className={s.header}>
        <h6 className={s.headerTitle} data-testid="modal-title">
          {title}
        </h6>
        <button onClick={onClose} className={s.closeButton} data-testid="close-button">
          <img width={22} height={22} src="/icons/close.svg" alt="close" />
        </button>
      </div>
      <div className={s.errorBox}>
        <img width={16} height={16} src="/icons/warning-red.svg" alt="warn icon" />
        <p className={s.errorText} data-testid="error-message">
          {errorMessage}
        </p>
      </div>
      {description && (
        <p className={s.descriptionText} data-testid="description-text">
          {description}
        </p>
      )}
      <div className={s.actions}>
        <button onClick={onClose} className={s.closeActionButton} data-testid="close-action-button">
          Close
        </button>
      </div>
    </>
  );
}
