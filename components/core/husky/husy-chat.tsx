'use client';
import HuskyChatActions from './husky-chat-actions';
import HuskyChatAnswer from './husky-chat-answer';
import HuskyChatQuestion from './husky-chat-question';
import HuskyChatSuggestions from './husky-chat-suggestion';

interface HuskyChatProps {
  mode: 'blog' | 'chat';
  chats: any[];
  onFollowupClicked: (ques: string) => Promise<void>;
  onShareClicked?: () => Promise<void>;
  onPromptClicked: (ques: string) => Promise<void>;
  onRegenerate: (ques: string) => Promise<void>;
  onQuestionEdit: (ques: string) => void;
  onFeedback: (ques: string, answer: string) => Promise<void>;
  blogId?: string;
  isAnswerLoading: boolean;
}
function HuskyChat({ mode, chats, onFollowupClicked, isAnswerLoading, onQuestionEdit, onShareClicked, onPromptClicked, onRegenerate, onFeedback, blogId }: HuskyChatProps) {
  const initialPrompts = [
    { text: 'What are the advantanges of IPFS?', icon: '✨' },
    { text: 'Teams with most members', icon: '👥' },
    { text: 'Upcoming Events', icon: '📅' },
  ];

  return (
    <>
      <div className="huskychat">
        <div className="huskychat__threads">
          {chats.map((chat: any, index: number) => (
            <div className="huskychat__threads__item" key={`chat-${index}`}>
              <HuskyChatQuestion blogId={blogId} onShareClicked={onShareClicked} viewCount={chat?.viewCount} sources={chat?.answerSourceLinks} shareCount={chat?.shareCount} question={chat?.question} />
              <HuskyChatAnswer onFeedback={onFeedback} onRegenerate={onRegenerate} onQuestionEdit={onQuestionEdit} isLastIndex={index === chats.length - 1} question={chat?.question} mode={mode} answer={chat?.answer} />
              <HuskyChatSuggestions isAnswerLoading={isAnswerLoading} chatIndex={index} onFollowupClicked={onFollowupClicked} followupQuestions={chat?.followupQuestions} />
              {(mode !== 'blog' && chat?.actions?.length > 0) && <HuskyChatActions actions={chat?.actions}/>}
            </div>
          ))}
        </div>
        {chats.length === 0 && !isAnswerLoading && (
          <div className="huskychat__empty">
            <img className="huskychat__empty__img" src="/images/husky-empty.png" />
            <div className="huskychat__empty__prompts">
              <div className="huskychat__empty__prompts__title">
                <img src="/icons/enter-green.svg" />
                <p className="title">Try searching</p>
              </div>
              {initialPrompts.map((prompt) => (
                <div onClick={async () => await onPromptClicked(prompt.text)} className="huskychat__empty__prompts__item" key={prompt.text}>
                  <p>{prompt.icon}</p>
                  <p>{prompt.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style jsx>
        {`
          
          .huskychat {
            padding: 16px 20px;
            position: relative;
          }
        
          .huskychat__empty {
            display: flex;
            flex-direction: column;
            width: 100%;
            align-items: center;
            justify-content: center;
          }
          .huskychat__empty__prompts {
            display: flex;
            gap: 16px;
            flex-direction: column;
            padding: 16px;
            position: absolute;
            top: 150px;
            width: 100%;
            left: 0;
            right: 0;
            justify-content: center;
            align-items: center;
          }
          .huskychat__empty__prompts__item {
            display: flex;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
            align-items: center;
            cursor: pointer;
            background: white;
            padding: 4px 12px;
            border-radius: 30px;
            border: 1px solid lightgrey;
            color: #1e3a8a;
          }
          .huskychat__empty__prompts__title {
            display: flex;
            align-items: center;
            font-size: 12px;
            font-weight: 500;
            gap: 4px;
            color: #108f64;
          }
          .huskychat__empty__img {
            width: 95%;
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
            align-items: center;
          }

          @media (min-width: 1024px) {
            .huskychat {
              padding: 16px 24px;
            }
            .huskychat__empty__img {
             width: 560px;
            }
             .huskychat__empty__prompts {
              flex-direction: row;
               top: 300px;
             }
           
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;