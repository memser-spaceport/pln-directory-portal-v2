import HuskyAnswerLoader from '@/components/core/husky/husky-answer-loader';
import PreviewMessage from './preview-message';

interface MessagesProps {
  messages: {
    answer: string;
    question?: string;
    directoryResults?: Array<{ name: string; role: string; }>;
    actions: Array<{ name: string; type: string; directoryLink: string; }>;
    followUpQuestions?: string[];
  }[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  isAnswerLoading: boolean;
  onFeedback: (question: string, answer: string) => Promise<void>;
  onRegenerate: (question: string) => Promise<void>;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  onChatSubmission: any;
}

const Messages: React.FC<MessagesProps> = ({ messages, setMessages, onChatSubmission, isAnswerLoading, onFeedback, onRegenerate, onQuestionEdit, onCopyAnswer }) => {
  return (
    <>
      <div className="chat__messages">
        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} onChatSubmission={onChatSubmission} isLastIndex={index === messages.length - 1} onFeedback={onFeedback} onRegenerate={onRegenerate} onQuestionEdit={onQuestionEdit} onCopyAnswer={onCopyAnswer} />
        ))}
        {isAnswerLoading && <HuskyAnswerLoader data-testid="chat-answer-loader" />}
      </div>
      <style jsx>{`
        .chat__messages {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </>
  );
};

export default Messages;
