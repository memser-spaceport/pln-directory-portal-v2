import CopyText from '../copy-text';

type HuskyAnswerActions = {
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onRegenerate: (ques: string) => Promise<void>;
  onCopyAnswer: (answer: string) => Promise<void>;
  answer: string;
  isLastIndex: boolean;
  question: string;
};

const HuskyAnswerActions = ({ onQuestionEdit, onFeedback, onRegenerate, onCopyAnswer, answer, isLastIndex, question }: HuskyAnswerActions) => {
  const onFeedbackClicked = async () => {
    await onFeedback(question, answer);
  };
  return (
    <>
      <div className="chat__ansactions">
        <div className={`chat__ansactions__cn`}>
          {isLastIndex && <img onClick={async () => await onRegenerate(question)} className="chat__ansactions__cn__item" title="regenerate response" src="/icons/refresh-circle.svg" />}
          {isLastIndex && <img onClick={() => onQuestionEdit(question)} className="chat__ansactions__cn__item" title="edit question" src="/icons/edit-chat.svg" />}
          <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
            <img className="chat__ansactions__cn__item--copy" title="copy response" src="/icons/copy.svg" />
          </CopyText>
          <img className="chat__ansactions__cn__item" title="Submit feedback" onClick={onFeedbackClicked} src="/icons/feedback.svg" />
        </div>
      </div>

      <style jsx>{`
        .chat__ansactions {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat__ansactions__cn {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .chat__ansactions__cn__item {
          cursor: pointer;
        }

        .chat__ansactions__cn__item--copy {
          margin-top: 4px;
        }
      `}</style>
    </>
  );
};

export default HuskyAnswerActions;
