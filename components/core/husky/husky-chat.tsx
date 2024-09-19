'use client';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import HuskyChatActions from './husky-chat-actions';
import HuskyChatAnswer from './husky-chat-answer';
import HuskyChatQuestion from './husky-chat-question';
import HuskyChatSuggestions from './husky-chat-suggestion';
import HuskyEmptyChat from './husky-empty-chat';

interface HuskyChatProps {
  mode: 'blog' | 'chat';
  chats: any[];
  onFollowupClicked: (ques: string) => Promise<void>;
  onShareClicked?: () => Promise<void>;
  onPromptClicked: (ques: string) => Promise<void>;
  onRegenerate: (ques: string) => Promise<void>;
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  onCopyAnswer: (answer: string) => Promise<void>;
  blogId?: string;
  isAnswerLoading: boolean;
}
function HuskyChat({ mode, chats, onFollowupClicked, isAnswerLoading, onQuestionEdit, onShareClicked, onPromptClicked, onCopyAnswer, onRegenerate, onFeedback, blogId }: HuskyChatProps) {
  return (
    <>
      <div className="huskychat">
        {chats.length > 0 && <div className="huskychat__threads">
          {chats.map((chat: any, index: number) => (
            <div className="huskychat__threads__item" key={`chat-${index}`}>
              {!chat.isError && (
                <>
                  <HuskyChatQuestion
                    blogId={blogId}
                    onShareClicked={onShareClicked}
                    viewCount={chat?.viewCount}
                    sources={chat?.answerSourceLinks}
                    shareCount={chat?.shareCount}
                    question={chat?.question}
                  />
                  <HuskyChatAnswer
                    onCopyAnswer={onCopyAnswer}
                    onFeedback={onFeedback}
                    onRegenerate={onRegenerate}
                    onQuestionEdit={onQuestionEdit}
                    isLastIndex={index === chats.length - 1}
                    question={chat?.question}
                    mode={mode}
                    answer={chat?.answer}
                  />
                  <HuskyChatSuggestions isAnswerLoading={isAnswerLoading} chatIndex={index} onFollowupClicked={onFollowupClicked} followupQuestions={chat?.followupQuestions} />
                  {mode !== 'blog' && chat?.actions?.length > 0 && <HuskyChatActions actions={chat?.actions} />}
                </>
              )}
              {chat.isError && (
                <>
                  <HuskyChatQuestion
                    blogId={blogId}
                    onShareClicked={onShareClicked}
                    viewCount={chat?.viewCount}
                    sources={chat?.answerSourceLinks}
                    shareCount={chat?.shareCount}
                    question={chat?.question}
                  />
                  <p className="huskychat__threads__item__error">
                    <img src="/icons/info.svg" />
                    <span>Something went wrong, we are unable to provide a response. Please try again later</span>
                  </p>
                </>
              )}
            </div>
          ))}
        </div>}
        {chats.length === 0 && !isAnswerLoading && <HuskyEmptyChat onPromptClicked={onPromptClicked} />}
      </div>
      <style jsx>
        {`
          .huskychat {
            position: relative;
          }

          .huskychat__threads {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 36px;
            padding: 16px;
          }
          .huskychat__threads__item {
            display: flex;
            flex-direction: column;
            gap: 24px;
            align-items: center;
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

          @media (min-width: 1024px) {
           
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
