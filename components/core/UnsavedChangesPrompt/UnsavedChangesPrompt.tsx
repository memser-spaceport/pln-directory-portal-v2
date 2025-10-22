'use client';

import styles from './UnsavedChangesPrompt.module.scss';

interface Props {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnsavedChangesPrompt = ({ show, onConfirm, onCancel }: Props) => {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>
          <WarningIcon />
        </div>
        <h3>Discard changes?</h3>
        <p>You&apos;ve made changes that haven&apos;t been saved. If you leave now, your edits will be lost.</p>
        <div className={styles.actions}>
          <button onClick={onConfirm} className={styles.confirm}>
            Discard Changes
          </button>
          <button onClick={onCancel} className={styles.cancel}>
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
};

const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M29.5994 23.5112L18.6681 4.52749C18.395 4.0624 18.005 3.67676 17.5369 3.40882C17.0688 3.14087 16.5388 2.99991 15.9994 2.99991C15.46 2.99991 14.93 3.14087 14.4619 3.40882C13.9938 3.67676 13.6038 4.0624 13.3306 4.52749L2.39939 23.5112C2.13656 23.9611 1.99805 24.4727 1.99805 24.9937C1.99805 25.5147 2.13656 26.0264 2.39939 26.4762C2.66905 26.9441 3.05835 27.3319 3.52734 27.5997C3.99633 27.8674 4.52812 28.0056 5.06814 28H26.9306C27.4702 28.0052 28.0015 27.8668 28.47 27.599C28.9385 27.3313 29.3274 26.9438 29.5969 26.4762C29.8601 26.0266 29.999 25.5151 29.9995 24.9941C29.9999 24.4731 29.8618 23.9613 29.5994 23.5112ZM14.9994 13C14.9994 12.7348 15.1047 12.4804 15.2923 12.2929C15.4798 12.1053 15.7342 12 15.9994 12C16.2646 12 16.519 12.1053 16.7065 12.2929C16.894 12.4804 16.9994 12.7348 16.9994 13V18C16.9994 18.2652 16.894 18.5196 16.7065 18.7071C16.519 18.8946 16.2646 19 15.9994 19C15.7342 19 15.4798 18.8946 15.2923 18.7071C15.1047 18.5196 14.9994 18.2652 14.9994 18V13ZM15.9994 24C15.7027 24 15.4127 23.912 15.166 23.7472C14.9194 23.5824 14.7271 23.3481 14.6136 23.074C14.5 22.7999 14.4703 22.4983 14.5282 22.2074C14.5861 21.9164 14.7289 21.6491 14.9387 21.4393C15.1485 21.2296 15.4158 21.0867 15.7068 21.0288C15.9977 20.9709 16.2993 21.0006 16.5734 21.1142C16.8475 21.2277 17.0818 21.42 17.2466 21.6666C17.4114 21.9133 17.4994 22.2033 17.4994 22.5C17.4994 22.8978 17.3414 23.2793 17.06 23.5606C16.7787 23.842 16.3972 24 15.9994 24Z"
      fill="#1B4DFF"
    />
  </svg>
);
