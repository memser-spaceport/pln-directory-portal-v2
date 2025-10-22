import HuskyAnswerLoader from '@/components/core/husky/husky-answer-loader';
import PreviewMessage from './preview-message';
import { memo } from 'react';

interface MessagesProps {
  messages: {
    answer: string;
    question: string;
    relatedResults: Array<{ name: string; role: string }>;
    followUpQuestions: string[];
    sources?: Array<any>;
    actions: Array<{ name: string; type: string; directoryLink: string }>;
    isError?: boolean;
    sql: Array<{ name: string; type: string; source: string }>;
  }[];
  isAnswerLoading: boolean;
  onFeedback: (question: string, answer: string) => Promise<void>;
  onRegenerate: (question: string) => void;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  onFollowupClicked: (question: string) => void;
  isLoadingObject: boolean;
  threadId?: string;
}

const Messages: React.FC<MessagesProps> = ({
  messages,
  onFollowupClicked,
  isAnswerLoading,
  onFeedback,
  onRegenerate,
  onQuestionEdit,
  onCopyAnswer,
  isLoadingObject,
  threadId,
}) => {
  return (
    <>
      <div className="chat__messages">
        {messages.map((message, index) => (
          <PreviewMessage
            key={`message-${index}`}
            message={message}
            isLastIndex={index === messages.length - 1}
            onFollowupClicked={onFollowupClicked}
            onFeedback={onFeedback}
            onRegenerate={onRegenerate}
            onQuestionEdit={onQuestionEdit}
            onCopyAnswer={onCopyAnswer}
            isLoadingObject={isLoadingObject}
            isAnswerLoading={isAnswerLoading}
            threadId={threadId}
          />
        ))}
        {isAnswerLoading && <HuskyAnswerLoader data-testid="chat-answer-loader" />}
      </div>
      <style jsx>{`
        .chat__messages {
          //padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 1024px) {
          .chat__messages {
            //padding: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default memo(Messages);
