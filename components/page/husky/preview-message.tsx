import { memo } from 'react';

import InfoBox from '@/components/ui/info-box';
import { Markdown } from '../../common/Markdown';
import { PopoverDp } from '@/components/core/popover-dp';
import HuskySourceCard from '@/components/core/husky/husky-source-card';
import RelatedResults from './related-results';
import FollowupQuestions from './followup-questions';
import ChatMessageActions from '@/components/page/husky/chat-actions';
import DirectoryResults from './directory-results';
interface PreviewMessageProps {
  message: {
    answer: string;
    question: string;
    relatedResults: Array<{ name: string; role: string }>;
    followUpQuestions: string[];
    sources?: Array<any>;
    actions: Array<{ name: string; type: string; directoryLink: string }>;
    isError?: boolean;
    sql: Array<{ name: string; type: string; source: string }>;
  };
  isLastIndex: boolean;
  onFollowupClicked: (question: string) => void;
  onFeedback: (question: string, answer: string) => Promise<void>;
  onRegenerate: (question: string) => void;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  isLoadingObject: boolean;
  isAnswerLoading: boolean;
  threadId?: string;
}

const PreviewMessage: React.FC<PreviewMessageProps> = ({ message, onFollowupClicked, isLastIndex, onFeedback, onRegenerate, onQuestionEdit, onCopyAnswer, isLoadingObject, isAnswerLoading, threadId }) => {
  return (
    <div className={`preview-message`}>
      {/* question */}
      {message?.question && (
        <div className="preview-message__question-block">
          <h2 className="preview-message__question-text">{message.question}</h2>
        </div>
      )}

      {/* answer block*/}
      {(message.answer || message.isError) && (
        <div className="preview-message__content-block">
          {/* error */}
          {message.isError && (
            <p className="preview-message__error">
              <img src="/icons/info.svg" alt="Error" />
              <span>Something went wrong, we are unable to provide a response. Please try again later</span>
            </p>
          )}

          {message?.answer && (
            <>
              {/* sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="preview-message__header">
                  <PopoverDp.Wrapper>
                    <InfoBox info={`${message.sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
                    <PopoverDp.Pane position="bottom">
                      <HuskySourceCard sources={message.sources} />
                    </PopoverDp.Pane>
                  </PopoverDp.Wrapper>
                </div>
              )}

              {/* answer */}
              <div className="preview-message__content">
                <Markdown>{message.answer}</Markdown>
              </div>

              {/* sql results */}
              {message.sql?.length > 0 && <DirectoryResults actions={message.sql} />}

              {/* follow up questions */}
              {message.followUpQuestions?.length > 0 && (
                <FollowupQuestions
                  isLoadingObject={isLoadingObject}
                  isAnswerLoading={isAnswerLoading}
                  chatIndex={0}
                  onFollowupClicked={onFollowupClicked}
                  followupQuestions={message.followUpQuestions}
                />
              )}

              {/* related results */}
              {message.actions?.length > 0 && <RelatedResults actions={message.actions} />}
            </>
          )}

          {/* actions */}
          <ChatMessageActions
            isLoadingObject={isLoadingObject}
            isLastIndex={isLastIndex}
            onCopyAnswer={onCopyAnswer || (async () => {})}
            onRegenerate={onRegenerate}
            onQuestionEdit={onQuestionEdit || (() => {})}
            onFeedback={onFeedback}
            question={message.question || ''}
            answer={message.answer || ''}
            hideActions={message.isError || false}
            threadId={threadId}
          />
        </div>
      )}
      <style jsx>{`
        .preview-message {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }

        .preview-message__content-block {
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

        .preview-message__error {
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

        .preview-message__question-block {
          margin-bottom: 8px;
        }

        .preview-message__question-text {
          font-weight: 500;
          font-size: 16px;
          line-height: 26px;
          color: black;
        }

        .preview-message__content {
          font-size: 14px;
          line-height: 26px;
          margin-bottom: 16px;
        }

        .preview-message__header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .preview-message__question-text {
            font-size: 27px;
            line-height: 39px;
            font-weight: 400;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(PreviewMessage);
