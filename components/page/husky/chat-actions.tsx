import CopyText from '@/components/core/copy-text';

type ChatMessageActions = {
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onRegenerate: (ques: string) => Promise<void>;
  onCopyAnswer: (answer: string) => Promise<void>;
  answer: string;
  isLastIndex: boolean;
  question: string;
  hideActions: boolean;
};

const ChatMessageActions = ({ onQuestionEdit, onFeedback, onRegenerate, onCopyAnswer, answer, isLastIndex, question, hideActions }: ChatMessageActions) => {
  const onFeedbackClicked = async () => {
    await onFeedback(question, answer);
  };
  return (
    <>
      <div className="message-actions">
        <div className={`message-actions__container`}>
          {isLastIndex && <img onClick={async () => await onRegenerate(question)} className="message-actions__item" title="regenerate response" src="/icons/refresh-circle.svg" />}
          {isLastIndex && <img onClick={() => onQuestionEdit(question)} className="message-actions__item" title="edit question" src="/icons/edit-chat.svg" />}
          {!hideActions && (
            <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
              <img className="message-actions__item--copy" title="copy response" src="/icons/copy.svg" />
            </CopyText>
          )}
          <img className="message-actions__item" title="Submit feedback" onClick={onFeedbackClicked} src="/icons/feedback.svg" />
        </div>
      </div>

      <style jsx>{`
        .message-actions {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .message-actions__container {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .message-actions__item {
          cursor: pointer;
        }

        .message-actions__item--copy {
          margin-top: 4px;
        }
      `}</style>
    </>
  );
};

export default ChatMessageActions;
