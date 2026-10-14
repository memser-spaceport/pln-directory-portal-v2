import clsx from 'clsx';
import { memo, ReactNode } from 'react';

import CopyText from '@/components/core/copy-text';

import s from './ChatMessageActions.module.scss';

interface Props {
  onQuestionEdit: (question: string) => void;
  onRegenerate?: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  answer: string;
  isLastIndex: boolean;
  question: string;
  hideActions: boolean;
  isLoadingObject: boolean;
  feedbackSlot?: ReactNode;
  sourcesSlot?: ReactNode;
}

export const ChatMessageActions = memo(function ChatMessageActions(props: Props) {
  const {
    onQuestionEdit,
    onRegenerate,
    onCopyAnswer,
    answer,
    isLastIndex,
    question,
    hideActions,
    isLoadingObject,
    feedbackSlot,
    sourcesSlot,
  } = props;

  return (
    <div className={s.root}>
      <div data-state={isLoadingObject ? 'loading' : ''} className={s.container}>
        {isLastIndex && onRegenerate && (
          <img
            onClick={() => onRegenerate(question)}
            className={s.item}
            title="Regenerate response"
            src="/icons/refresh-circle.svg"
          />
        )}
        {isLastIndex && (
          <img
            onClick={() => onQuestionEdit(question)}
            className={s.item}
            title="Edit question"
            src="/icons/edit-chat.svg"
          />
        )}
        {!hideActions && (
          <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
            <img className={clsx(s.item, s.copy)} title="Copy response" src="/icons/copy.svg" />
          </CopyText>
        )}
        {feedbackSlot}
      </div>
      {sourcesSlot}
    </div>
  );
});
