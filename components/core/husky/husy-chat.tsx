'use client';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
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
  onCopyAnswer: (answer: string) => Promise<void>;
  blogId?: string;
  isAnswerLoading: boolean;
}
function HuskyChat({ mode, chats, onFollowupClicked, isAnswerLoading, onQuestionEdit, onShareClicked, onPromptClicked, onCopyAnswer, onRegenerate, onFeedback, blogId }: HuskyChatProps) {
  const initialPrompts = [
    { text: 'Vision of Protocol Labs', icon: '✨' },
    { text: 'Retrospection of LabWeek', icon: '📅' },
    { text: 'Focus area of Protocol Labs', icon: '🎯' },
  ];

  const { trackExplorationPromptSelection } = useHuskyAnalytics();

  const onExplorationPromptClicked = async (ques: string) => {
    trackExplorationPromptSelection(ques);
    await onPromptClicked(ques);
  };

  return (
    <>
      <div className="huskychat">
        <div className="huskychat__threads">
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
        </div>
        {chats.length === 0 && !isAnswerLoading && (
          <div className="huskychat__empty">
            <img className="huskychat__empty__img" src="/images/husky-empty.svg" />
            <div className="huskychat__empty__prompts">
              <div className="huskychat__empty__prompts__title">
                <img src="/icons/enter-green.svg" />
                <p className="title">Try asking</p>
              </div>
              {initialPrompts.map((prompt) => (
                <div onClick={async () => await onExplorationPromptClicked(prompt.text)} className="huskychat__empty__prompts__item" key={prompt.text}>
                  <p>{prompt.icon}</p>
                  <p>{prompt.text}</p>
                </div>
              ))}
            </div>
            <div className="husky__empty__info">
              <div className="husky__empty__info__head">
                <img className="husky-loader__info__text__icon" src="/icons/husky-bone-blue.svg" />
                <p>What is Husky?</p>
              </div>
              <p className="husky__empty__info__text">
                HuskyAI is our first LLM chatbot to help you explore the network’s teams, projects, events, and members. It helps you fetch the right answers to all your network questions, and brings
                you recommendations. Husky has been trained on publicly available network data for few set of datasets but we can train your dataset too if you are interested to let others know about
                what you are doing.
              </p>
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
          .huskychat__empty__prompts {
            display: flex;
            gap: 16px;
            flex-direction: column;
            padding: 16px;
            width: 100%;
            margin-top: -50px;
            justify-content: center;
            align-items: center;
            z-index: 1;
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
            width: 90%;
            z-index: 0;
            display: inline;
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
          .husky__empty__info__text {
            color: #1e3a8a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
          }
          .husky__empty__info__head {
            color: #156ff7;
            display: flex;
            gap: 8px;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .husky__empty__info {
            margin-top: 30px;
            border-radius: 8px;
            background: #f1f5f9;
            border: 1px solid #156ff7;
            padding: 16px;
            width: 90%;
             z-index: 1;
          }
          @media (min-width: 400px) {
             .huskychat__empty__img {
              
              top: 80px;

             }
            .huskychat__empty__prompts {
              margin-top: -50px;
            }

          }

            @media (min-width: 768px) {
            .huskychat__empty__img {
               width: 60%;
               top: 80px;

            }
            .huskychat__empty__prompts {
              margin-top: -100px;
            }

            .husky__empty__info {
              width: 80%;
              left: 10%;
              top: 550px;
            }

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
              margin-top: -180px;
            }
            .husky__empty__info {
              width: 681px;
              margin-top: 50px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
