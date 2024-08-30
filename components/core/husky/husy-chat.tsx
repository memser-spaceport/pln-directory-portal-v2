'use client';
import HuskyChatAnswer from './husky-chat-answer';
import HuskyChatQuestion from './husky-chat-question';
import HuskyChatSuggestions from './husky-chat-suggestion';

interface HuskyChatProps {
  mode: 'blog' | 'chat';
  chats: any[];
  onFollowupClicked: (ques: string) => Promise<void>;
  isAnswerLoading: boolean;
}
function HuskyChat({ mode, chats, onFollowupClicked, isAnswerLoading }: HuskyChatProps) {
  return (
    <>
      <div className="huskychat">
        <div className="huskychat__threads">
          {chats.map((chat: any, index: number) => (
            <div className="huskychat__threads__item" key={`chat-${index}`}>
              <HuskyChatQuestion viewCount={chat?.viewCount} sources={chat?.answerSourceLinks} shareCount={chat?.shareCount} question={chat?.question} />
              <HuskyChatAnswer mode={mode} answer={chat?.answer} />
              <HuskyChatSuggestions isAnswerLoading={isAnswerLoading} chatIndex={index} onFollowupClicked={onFollowupClicked} followupQuestions={chat?.followupQuestions} />
            </div>
          ))}
        </div>
      </div>
      <style jsx>
        {`
          .huskychat {
            padding: 16px 20px;
          }
          .huskychat__threads {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 36px;
          }
          .huskychat__threads__item {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          @media (min-width: 1024px) {
            .huskychat {
              padding: 16px 24px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
