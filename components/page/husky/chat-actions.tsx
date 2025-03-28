import CopyText from '@/components/core/copy-text';
import { memo, useState } from 'react';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

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
  threadId?: string;
};

const ChatMessageActions = ({ onQuestionEdit, onFeedback, onRegenerate, onCopyAnswer, answer, isLastIndex, question, hideActions, isLoadingObject, threadId }: ChatMessageActions) => {
  const [copied, setCopied] = useState(false);
  const analytics = useHuskyAnalytics();
  
  const handleFeedbackClick = async () => {
    await onFeedback(question, answer);
  };
  
  const handleShareClick = () => {
    navigator.clipboard.writeText(`${window.location.origin}/husky/chat/${threadId}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
    
    // Track share event with analytics
    if (threadId) {
      analytics.trackThreadShareClicked({
        threadId,
        title: question, // Using question as title for analytics
        from: 'chat_message_actions' // Identifies this component as the source of the share action
      });
    }
  };
  
  return (
    <>
      <div className="chat-message-actions">
        <div data-state={isLoadingObject ? 'loading' : ''} className={`chat-message-actions__container`}>
          {isLastIndex && <img onClick={async () => await onRegenerate(question)} className="chat-message-actions__item" title="Regenerate response" src="/icons/refresh-circle.svg" />}
          {isLastIndex && <img onClick={() => onQuestionEdit(question)} className="chat-message-actions__item" title="Edit question" src="/icons/edit-chat.svg" />}
          {!hideActions && (
            <CopyText onCopyCallback={onCopyAnswer} textToCopy={answer}>
              <img className="chat-message-actions__item chat-message-actions__item--copy" title="Copy response" src="/icons/copy.svg" />
            </CopyText>
          )}
          <img className="chat-message-actions__item" title="Submit feedback" onClick={handleFeedbackClick} src="/icons/feedback.svg" />
        </div>
        <div className="chat-message-actions__share">
          {isLastIndex && !hideActions && threadId && (
            <div className="share-button-container">
              <button 
                className="share-button" 
                onClick={handleShareClick}
                title="Share entire thread"
              >
                <img src="/icons/share-gray.svg" alt="Share" />
                <span>Share entire thread</span>
              </button>
              {copied && <div className="copy-popover">Copied!</div>}
            </div>
          )}
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
        
        .share-button-container {
          position: relative;
        }
        
        .share-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid #CBD5E1;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary);
          padding: 4px 8px;
          transition: all 0.2s ease;
        }
        
        .share-button:hover {
          color: var(--text-primary);
        }
        
        .share-button img {
          width: 16px;
          height: 16px;
        }
        
        .share-button span {
          font-weight: 400;
          font-size: 12px;
          line-height: 22px;
        }
        
        .copy-popover {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          animation: fadeIn 0.3s ease-in-out;
          z-index: 10;
        }
        
        .copy-popover::before {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #333;
        }
      `}</style>
    </>
  );
};

export default memo(ChatMessageActions);
