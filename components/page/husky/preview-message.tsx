import { memo } from 'react';

import { Markdown } from '../../common/Markdown';
import RelatedResults from './related-results';
import FollowupQuestions from './followup-questions';
import ChatMessageActions from '@/components/page/husky/chat-actions';
import DirectoryResults from './directory-results';
import { AnswerSources } from './AnswerSources';
import { AnswerThumbs } from './AnswerThumbs';
interface PreviewMessageProps {
  message: {
    answer: string;
    question: string;
    relatedResults: Array<{ name: string; role: string }>;
    followUpQuestions: string[];
    sources?: Array<any>;
    sourceRefs?: Array<{ index: number; title: string; type: string; directoryLink?: string; externalUrl?: string }>;
    actions: Array<{ name: string; type: string; directoryLink: string }>;
    isError?: boolean;
    sql: Array<{ name: string; type: string; source: string }>;
  };
  isLastIndex: boolean;
  onFollowupClicked: (question: string) => void;
  onRegenerate?: (question: string) => void;
  onQuestionEdit: (question: string) => void;
  onCopyAnswer: (answer: string) => Promise<void>;
  isLoadingObject: boolean;
  isAnswerLoading: boolean;
  isStreaming: boolean;
  showRating: boolean;
  canRate: boolean;
}

const PreviewMessage: React.FC<PreviewMessageProps> = ({
  message,
  onFollowupClicked,
  isLastIndex,
  onRegenerate,
  onQuestionEdit,
  onCopyAnswer,
  isLoadingObject,
  isAnswerLoading,
  isStreaming,
  showRating,
  canRate,
}) => {
  const showThumbs = !isStreaming && !message.isError && showRating;

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
              {/* answer */}
              <div className="preview-message__content">
                <Markdown sourceRefs={message.sourceRefs}>{message.answer}</Markdown>
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
            question={message.question || ''}
            answer={message.answer || ''}
            hideActions={message.isError || false}
            feedbackSlot={
              showThumbs && (
                <AnswerThumbs
                  key={`${message.question}::${message.answer}`}
                  question={message.question || ''}
                  answer={message.answer || ''}
                  disabled={!canRate}
                />
              )
            }
            sourcesSlot={!isStreaming && <AnswerSources sources={message.sources} sourceRefs={message.sourceRefs} />}
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

        @media (min-width: 1024px) {
          .preview-message__question-text {
            font-size: 18px;
            line-height: 20px;
            font-weight: 600;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(PreviewMessage);
