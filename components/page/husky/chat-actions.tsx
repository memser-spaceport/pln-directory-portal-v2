import CopyText from '@/components/core/copy-text';
import { memo, ReactNode } from 'react';

type ChatMessageActions = {
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onRegenerate: (ques: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  answer: string;
  isLastIndex: boolean;
  question: string;
  hideActions: boolean;
  isLoadingObject: boolean;
  // Replaces the "Submit feedback" (1-5 dialog) button, e.g. with inline thumbs on the AI Search page
  feedbackSlot?: ReactNode;
};

const ChatMessageActions = ({
  onQuestionEdit,
  onFeedback,
  onRegenerate,
  onCopyAnswer,
  answer,
  isLastIndex,
  question,
  hideActions,
  isLoadingObject,
  feedbackSlot,
}: ChatMessageActions) => {
  const handleFeedbackClick = async () => {
    await onFeedback(question, answer);
  };

  return (
    <>
      <div className="chat-message-actions">
        <div data-state={isLoadingObject ? 'loading' : ''} className={`chat-message-actions__container`}>
          {isLastIndex && (
            <img
              onClick={async () => await onRegenerate(question)}
              className="chat-message-actions__item"
              title="Regenerate response"
              src="/icons/refresh-circle.svg"
            />
          )}
          {isLastIndex && (
            <img
              onClick={() => onQuestionEdit(question)}
              className="chat-message-actions__item"
              title="Edit question"
              src="/icons/edit-chat.svg"
            />
          )}
          {!hideActions && (
            <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
              <img
                className="chat-message-actions__item chat-message-actions__item--copy"
                title="Copy response"
                src="/icons/copy.svg"
              />
            </CopyText>
          )}
          {feedbackSlot === undefined && (
            <img
              className="chat-message-actions__item"
              title="Submit feedback"
              onClick={handleFeedbackClick}
              src="/icons/feedback.svg"
            />
          )}
          {feedbackSlot}
        </div>
      </div>

      <style jsx>{`
        .chat-message-actions {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-message-actions__container {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .chat-message-actions__item {
          cursor: pointer;
        }

        .chat-message-actions__item--copy {
          margin-top: 4px;
        }

        .chat-message-actions__container[data-state='loading'] .chat-message-actions__item {
          cursor: default;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default memo(ChatMessageActions);
