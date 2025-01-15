'use client';
import HuskyChatActions from './husky-chat-actions';
import HuskyChatAnswer from './husky-chat-answer';
import HuskyChatQuestion from './husky-chat-question';
import HuskyChatSuggestions from './husky-chat-suggestion';
import HuskyAnswerActions from './husky-answer-actions';

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
  isLoadingObject: boolean;
}
function HuskyChat({
  mode,
  chats,
  onFollowupClicked,
  isAnswerLoading,
  onQuestionEdit,
  onShareClicked,
  onPromptClicked,
  onCopyAnswer,
  onRegenerate,
  onFeedback,
  blogId,
  isLoadingObject,
}: HuskyChatProps) {
  return (
    <>
      <div className="huskychat">
        {chats.length > 0 && (
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
                      mode={mode}
                    />
                    {chat.answer && (
                      <div className="huskychat__threads__item__ansWrpr">
                        <HuskyChatAnswer question={chat?.question} mode={mode} answer={chat?.answer} sources={chat?.answerSourceLinks} />

                        {chat?.followupQuestions?.length > 0 && (
                          <HuskyChatSuggestions
                            isLoadingObject={isLoadingObject}
                            isAnswerLoading={isAnswerLoading}
                            chatIndex={index}
                            onFollowupClicked={onFollowupClicked}
                            followupQuestions={chat?.followupQuestions}
                          />
                        )}
                        {mode !== 'blog' && chat?.actions?.length > 0 && <HuskyChatActions actions={chat?.actions} />}
                        {mode !== 'blog' && (
                          <HuskyAnswerActions
                            isLastIndex={index === chats.length - 1}
                            onCopyAnswer={onCopyAnswer}
                            onRegenerate={onRegenerate}
                            onQuestionEdit={onQuestionEdit}
                            onFeedback={onFeedback}
                            question={chat?.question}
                            answer={chat?.answer}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                {chat.isError && (
                  <div className="huskychat__threads__item__errWrpr">
                    <HuskyChatQuestion
                      blogId={blogId}
                      onShareClicked={onShareClicked}
                      viewCount={chat?.viewCount}
                      sources={chat?.answerSourceLinks}
                      shareCount={chat?.shareCount}
                      question={chat?.question}
                      mode={mode}
                    />
                    <p className="huskychat__threads__item__error">
                      <img src="/icons/info.svg" />
                      <span>Something went wrong, we are unable to provide a response. Please try again later</span>
                    </p>
                    {mode !== 'blog' && (
                      <HuskyAnswerActions
                        isLastIndex={index === chats.length - 1}
                        onCopyAnswer={onCopyAnswer}
                        onRegenerate={onRegenerate}
                        onQuestionEdit={onQuestionEdit}
                        onFeedback={onFeedback}
                        question={chat?.question}
                        answer={chat?.answer}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
            padding: 12px;
          }
          .huskychat__threads__item {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }

          .huskychat__threads__item__ansWrpr {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            padding: 0px 10px 6px 10px;
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

          .huskychat__threads__item__errWrpr {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }

          @media (min-width: 1024px) {
            .huskychat__threads {
              padding: 16px;
            }

            .huskychat__threads__item__ansWrpr {
              padding: 0px 14px 8px 14px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyChat;
