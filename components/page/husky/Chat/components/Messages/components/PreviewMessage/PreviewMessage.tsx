import { memo } from 'react';

import { Markdown } from '@/components/common/Markdown';
import { FollowupQuestions } from '@/components/core/husky/FollowupQuestions';

import type { IChatMessage } from '../../types/chatMessage';

import { useAnswerFeedback } from './hooks/useAnswerFeedback';

import { AnswerThumbs } from './components/AnswerThumbs';
import { AnswerSources } from './components/AnswerSources';
import { RelatedResults } from './components/RelatedResults';
import { DirectoryResults } from './components/DirectoryResults';
import { ChatMessageActions } from './components/ChatMessageActions';
import { AnswerFeedbackReasons } from './components/AnswerFeedbackReasons';

import s from './PreviewMessage.module.scss';

interface Props {
  message: IChatMessage;
  threadId?: string;
  isLastIndex: boolean;
  onFollowupClicked: (question: string) => void;
  onRegenerate?: (question: string) => void;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  isLoadingObject: boolean;
  isStreaming: boolean;
  showRating: boolean;
  canRate: boolean;
}

export const PreviewMessage = memo(function PreviewMessage(props: Props) {
  const {
    message,
    threadId,
    isLastIndex,
    onFollowupClicked,
    onRegenerate,
    onQuestionEdit,
    onCopyAnswer,
    isLoadingObject,
    isStreaming,
    showRating,
    canRate,
  } = props;

  const showThumbs = !isStreaming && !message.isError && showRating;
  const { feedback, hasError, onUp, onDown, onSendReasons, onSkipReasons } = useAnswerFeedback({
    answerId: message.id,
    threadId,
    question: message.question,
    answer: message.answer,
    savedVote: message.feedback,
  });

  return (
    <div className={s.root}>
      {message.question && (
        <div className={s.questionBlock}>
          <h2 className={s.questionText}>{message.question}</h2>
        </div>
      )}

      {(message.answer || message.isError) && (
        <div className={s.contentBlock}>
          {message.isError && (
            <p className={s.error}>
              <img src="/icons/info.svg" alt="Error" />
              <span>Something went wrong, we are unable to provide a response. Please try again later</span>
            </p>
          )}

          {message.answer && (
            <>
              <div className={s.content}>
                <Markdown sourceRefs={message.sourceRefs}>{message.answer}</Markdown>
              </div>

              {message.sql?.length > 0 && <DirectoryResults actions={message.sql} />}

              {message.followUpQuestions?.length > 0 && (
                <FollowupQuestions
                  isLoadingObject={isLoadingObject}
                  onFollowupClicked={onFollowupClicked}
                  followupQuestions={message.followUpQuestions}
                />
              )}

              {message.actions?.length > 0 && <RelatedResults actions={message.actions} />}
            </>
          )}

          <ChatMessageActions
            isLoadingObject={isLoadingObject}
            isLastIndex={isLastIndex}
            onCopyAnswer={onCopyAnswer}
            onRegenerate={onRegenerate}
            onQuestionEdit={onQuestionEdit}
            question={message.question}
            answer={message.answer}
            hideActions={Boolean(message.isError)}
            feedbackSlot={
              showThumbs && (
                <AnswerThumbs feedback={feedback} hasError={hasError} disabled={!canRate} onUp={onUp} onDown={onDown} />
              )
            }
            sourcesSlot={!isStreaming && <AnswerSources sources={message.sources} sourceRefs={message.sourceRefs} />}
          />

          {showThumbs && feedback === 'down' && <AnswerFeedbackReasons onSend={onSendReasons} onSkip={onSkipReasons} />}
        </div>
      )}
    </div>
  );
});
