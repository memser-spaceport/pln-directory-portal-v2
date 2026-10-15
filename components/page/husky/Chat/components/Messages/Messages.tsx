import { memo } from 'react';

import HuskyAnswerLoader from '@/components/core/husky/husky-answer-loader';

import type { IChatMessage } from './types/chatMessage';

import { PreviewMessage } from './components/PreviewMessage';

import s from './Messages.module.scss';

interface Props {
  messages: IChatMessage[];
  threadId?: string;
  isAnswerLoading: boolean;
  statusLine?: string;
  onRegenerate?: (question: string) => void;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  onFollowupClicked: (question: string) => void;
  isLoadingObject: boolean;
  isStreaming: boolean;
  showRating: boolean;
  canRate: boolean;
}

export const Messages = memo(function Messages(props: Props) {
  const {
    messages,
    threadId,
    isAnswerLoading,
    statusLine,
    onRegenerate,
    onQuestionEdit,
    onCopyAnswer,
    onFollowupClicked,
    isLoadingObject,
    isStreaming,
    showRating,
    canRate,
  } = props;

  return (
    <div className={s.root}>
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          message={message}
          threadId={threadId}
          isLastIndex={index === messages.length - 1}
          onFollowupClicked={onFollowupClicked}
          onRegenerate={onRegenerate}
          onQuestionEdit={onQuestionEdit}
          onCopyAnswer={onCopyAnswer}
          isLoadingObject={isLoadingObject}
          isStreaming={isStreaming && index === messages.length - 1}
          showRating={showRating}
          canRate={canRate}
        />
      ))}
      {isAnswerLoading && <HuskyAnswerLoader label={statusLine} />}
    </div>
  );
});
