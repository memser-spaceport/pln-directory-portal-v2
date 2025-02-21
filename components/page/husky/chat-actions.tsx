import CopyText from '@/components/core/copy-text';
import { memo } from 'react';

type ChatMessageActions = {
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onRegenerate: (ques: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  answer: string;
  isLastIndex: boolean;
  question: string;
  hideActions: boolean;
};

const ChatMessageActions = ({ onQuestionEdit, onFeedback, onRegenerate, onCopyAnswer, answer, isLastIndex, question, hideActions }: ChatMessageActions) => {
  const handleFeedbackClick = async () => {
    await onFeedback(question, answer);
  };
  return (
    <>
      <div className="chat-message-actions">
        <div className={`chat-message-actions__container`}>
          {isLastIndex && <img onClick={async () => await onRegenerate(question)} className="chat-message-actions__item" title="Regenerate response" src="/icons/refresh-circle.svg" />}
          {isLastIndex && <img onClick={() => onQuestionEdit(question)} className="chat-message-actions__item" title="Edit question" src="/icons/edit-chat.svg" />}
          {!hideActions && (
            <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
              <img className="chat-message-actions__item chat-message-actions__item--copy" title="Copy response" src="/icons/copy.svg" />
            </CopyText>
          )}
          <img className="chat-message-actions__item" title="Submit feedback" onClick={handleFeedbackClick} src="/icons/feedback.svg" />
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
      `}</style>
    </>
  );
};

export default memo(ChatMessageActions);
