import clsx from 'clsx';

import { ThumbsDownIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import type { AnswerFeedbackState } from '../../types/answerFeedbackState';

import s from './AnswerThumbs.module.scss';

interface Props {
  feedback: AnswerFeedbackState;
  hasError: boolean;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
}

export const AnswerThumbs = (props: Props) => {
  const { feedback, hasError, disabled, onUp, onDown } = props;

  const isUp = feedback === 'up';
  const isDown = feedback === 'down' || feedback === 'sent';

  return (
    <span className={s.root}>
      <button
        type="button"
        className={clsx(s.button, isUp && s.chosen)}
        title="Good answer"
        aria-label="Good answer"
        aria-pressed={isUp}
        disabled={disabled}
        onClick={onUp}
      >
        <ThumbsUpOutlinedIcon />
      </button>
      <button
        type="button"
        className={clsx(s.button, isDown && s.chosen)}
        title="Not helpful"
        aria-label="Not helpful"
        aria-pressed={isDown}
        disabled={disabled}
        onClick={onDown}
      >
        <ThumbsDownIcon />
      </button>
      {(feedback === 'up' || feedback === 'sent') && (
        <span className={s.receipt} role="status">
          Thanks for your response
        </span>
      )}
      {hasError && (
        <span className={s.error} role="alert">
          Could not save your rating. Try again.
        </span>
      )}
    </span>
  );
};
