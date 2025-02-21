import InfoBox from '@/components/ui/info-box';
import { Markdown } from '../../common/Markdown';
import { PopoverDp } from '@/components/core/popover-dp';
import HuskySourceCard from '@/components/core/husky/husky-source-card';
import HuskyChatSuggestions from '@/components/core/husky/husky-chat-suggestion';
import RelatedResults from './related-results';
import FollowupQuestions from './followup-questions';
import ChatMessageActions from '@/components/page/husky/chat-actions';
import DirectoryResults from './directory-results';

interface MemberCardProps {
  name: string;
  role: string;
}

const MemberCard: React.FC<MemberCardProps> = ({ name, role }) => (
  <div className="member-card">
    <div className="avatar"></div>
    <div>
      <h3>{name}</h3>
      <p>{role}</p>
    </div>
    <style jsx>{`
      .member-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e5e7eb;
      }
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
      p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }
    `}</style>
  </div>
);

interface PreviewMessageProps {
  message: {
    answer: string;
    question?: string;
    directoryResults?: Array<{ name: string; role: string }>;
    relatedResults?: Array<{ name: string; role: string }>;
    followUpQuestions?: string[];
    sources?: Array<any>;
    actions?: Array<{ name: string; type: string; directoryLink: string }>;
    isError?: boolean;
  };
  isLastIndex: boolean;
  onChatSubmission: (message: { question: string; type: string }) => void;
  onFeedback: (question: string, answer: string) => Promise<void>;
  onRegenerate: (question: string) => Promise<void>;
  onQuestionEdit?: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
}

const PreviewMessage: React.FC<PreviewMessageProps> = ({ message, onChatSubmission, isLastIndex, onFeedback, onRegenerate, onQuestionEdit, onCopyAnswer }) => {
  console.log(message);
  return (
    <div className={`chat__message-container`}>
      {message.question && (
        <div className="question-block">
          <h2 className="question">{message.question}</h2>
        </div>
      )}

      {(message.answer || message.isError) && (
        <div className="chat__message content-block">
          {message.isError && <p className="huskychat__threads__item__error">
            <img src="/icons/info.svg" />
            <span>Something went wrong, we are unable to provide a response. Please try again later</span>
          </p>}
          {message.answer && (
            <>
              {message.sources && message.sources.length > 0 && (
                <div className="chat__ans__hdr">
                  <PopoverDp.Wrapper>
                    <InfoBox info={`${message.sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
                    <PopoverDp.Pane position="bottom">
                      <HuskySourceCard sources={message.sources} />
                    </PopoverDp.Pane>
                  </PopoverDp.Wrapper>
                </div>
              )}
              <div className="content">
                <Markdown>{message.answer}</Markdown>
              </div>
              {message.sql && message.sql.length > 0 && (
                <DirectoryResults actions={message.sql} />
              )}
              {message.actions && message.actions.length > 0 && <RelatedResults actions={message.actions} />}
              {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                <FollowupQuestions isLoadingObject={false} isAnswerLoading={false} chatIndex={0} onFollowupClicked={onChatSubmission} followupQuestions={message.followUpQuestions} />
              )}
            </>
          )}
          <ChatMessageActions
            isLastIndex={isLastIndex}
            onCopyAnswer={onCopyAnswer || (async () => {})}
            onRegenerate={onRegenerate}
            onQuestionEdit={onQuestionEdit || (() => {})}
            onFeedback={onFeedback}
            question={message.question || ''}
            answer={message.answer || ''}
            hideActions={message.isError || false}
          />
        </div>
      )}
      <style jsx>{`
        .chat__message-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }

        .chat__message {
          width: 100%;
          padding: 20px;
          background-color: white;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .huskychat__threads__item__error {
          width: 100%;
          text-align: left;
          padding: 16px;
          background: #ffd7d7;
          color: black;
          font-size: 14px;
          border-radius: 8px;
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .question-block {
          margin-bottom: 8px;
        }

        .content-block {
          width: 100%;
        }

        .question {
          font-weight: 400;
          font-size: 27px;
          line-height: 39px;
          letter-spacing: 0%;
          color: black;
          margin: 0;
        }

        .content {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .section {
          margin-top: 24px;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: #111827;
        }

        .icon {
          font-size: 20px;
        }

        .show-all {
          color: #2563eb;
          text-decoration: none;
          font-size: 14px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }

        .follow-up-questions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 4px;
        }

        .follow-up-question {
          padding: 16px;
          background-color: #f8f9fc;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 16px;
          color: #111827;
        }

        .follow-up-question:hover {
          background-color: #f3f4f6;
        }

        .user-message .chat__message {
          background-color: #0084ff;
          color: white;
        }

        .user-message .question {
          color: white;
        }

        .chat__ans__hdr {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .user-message .chat__ans__hdr {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PreviewMessage;
