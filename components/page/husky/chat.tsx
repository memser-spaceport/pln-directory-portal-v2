'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Messages from './messages';
import ChatFeedback from './chat-feedback';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import { getUniqueId, isMobileDevice } from '@/utils/common.utils';
import ChatHome from './chat-home';
import { IAnalyticsUserInfo } from '@/types/shared.types';
import { useMessages } from '@/hooks/useMessages';
import { getUserCredentials } from '@/utils/auth.utils';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import { getChatCount, updateLimitType, updateChatCount, checkRefreshToken } from '@/utils/husky.utlils';
import ChatInput from './chat-input';

interface ChatProps {
  isLoggedIn: boolean;
  userInfo: IAnalyticsUserInfo;
  initialMessages: any;
}

const Chat: React.FC<ChatProps> = ({ isLoggedIn, userInfo, initialMessages }) => {
  // const [input, setInput] = React.useState('');
  const [feedbackQandA, setFeedbackQandA] = useState({ question: '', answer: '' });
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest'>(); // daily limit
  const feedbackPopupRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>(''); // thread ID

  const { messages, setMessages, isAnswerLoading, addMessage, chatIsLoading, submitChat, stopChat, submitSql } = useMessages(initialMessages, threadIdRef.current);

  // Checks and sets the thread ID for the current chat session
  const checkAndSetThreadId = () => {
    if (threadIdRef.current && messages.length > 0) return threadIdRef.current;
    threadIdRef.current = getUniqueId();
    return threadIdRef.current;
  };

  // handle all chat submission
  const handleChatSubmission = async ({ question, type }: { question: string; type: 'prompt' | 'followup' | 'user-input'; previousContext?: { question: string; answer: string } | null }) => {
    try {
      const { userInfo } = await getUserCredentials(isLoggedIn);
      const hasRefreshToken = checkRefreshToken();

      if (!hasRefreshToken) {
        updateChatCount(); // update chat count for non-logged in users

        const countResponse = updateLimitType();
        if (countResponse === 'warn') {
          setLimitReached('warn'); // set limit reached to "warn" if the limit is reached
          return;
        }
        if (countResponse) {
          setLimitReached(countResponse); 
        }
      }

      const chatUid = checkAndSetThreadId();  // check and set the thread ID for the current chat session
      addMessage(question); // add new chat message

      const submitParams = {
        uid: chatUid,
        question,
        ...(userInfo?.name && { name: userInfo?.name }),
        ...(userInfo?.email && { email: userInfo?.email }),
        ...(userInfo?.uid && { directoryId: userInfo?.uid }),
      };

      submitChat(submitParams);
      submitSql({ uid: chatUid, question });
    } catch (error) {
      console.error(`Error in ${type} submission:`, error);
    }
  };

  // handle husky input submission
  const onHuskyInput = (query: string) => handleChatSubmission({ question: query, type: 'user-input' });

  // handle close feedback popup
  const onCloseFeedback = () => {
    setFeedbackQandA({ question: '', answer: '' });
    feedbackPopupRef.current?.close();
  };

  // handle regenerate by clicking the regenerate button
  const onRegenerate = useCallback(
    (query: string) => {
      if (!chatIsLoading) {
        onHuskyInput(query);
      }
    },
    [chatIsLoading]
  );

  // handle question edit by clicking the edit button
  const onQuestionEdit = useCallback((question: string) => {
    // setInput(question);
    textareaRef.current!.value = question;
    textareaRef.current!.focus();
  }, []);

  // handle copy answer by clicking the copy button
  const onCopyAnswer = (answer: string) => {
    return Promise.resolve();
  };

  // handle submit by clicking the send button
  const submitForm = () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      return;
    }
    onHuskyInput(trimmedValue);
    textareaRef.current!.value = '';
    // setInput('');
  };

  // handle feedback submission
  const onFeedback = async (question: string, answer: string) => {
    feedbackPopupRef.current?.showModal();
    setFeedbackQandA({ question, answer });
  };

  // handle submit by pressing enter key
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitForm();
    }
  };

  useEffect(() => {
    const storedInput = localStorage.getItem('input');
    if (storedInput) {
      handleChatSubmission({ question: storedInput, type: 'user-input' });
      localStorage.removeItem('input');
    }
  }, []);

  // scroll to the bottom of the chat when new message is added
  useEffect(() => {
    if (isAnswerLoading && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isAnswerLoading]);

  return (
    <>
      {messages?.length === 0 && (
        <div className="chat__home">
          <ChatHome onSubmit={onHuskyInput} setMessages={setMessages} />
        </div>
      )}

      {messages?.length > 0 && (
        <div className="chat" ref={chatContainerRef}>
          <div className="chat__messages-wrapper">
            <Messages
              messages={messages}
              onChatSubmission={handleChatSubmission}
              isAnswerLoading={isAnswerLoading}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onCopyAnswer={onCopyAnswer}
              onQuestionEdit={onQuestionEdit}
            />
          </div>

          <div className="chat__form-wrapper">
            <form className="chat__form">
              {limitReached && <HuskyLimitStrip mode="chat" count={DAILY_CHAT_LIMIT - getChatCount()} type={limitReached} from="husky-chat" />}
              <ChatInput
                ref={textareaRef}
                placeholder="Go ahead, ask anything!"
                rows={isMobileDevice() ? 1 : 2}
                autoFocus
                onKeyDown={handleKeyDown}
                onTextSubmit={submitForm}
                onStopStreaming={stopChat}
                isAnswerLoading={isAnswerLoading}
                isLoadingObject={chatIsLoading}
                isLimitReached={limitReached === 'warn' || limitReached === 'finalRequest'}
              />
            </form>
          </div>

          <dialog onClose={onCloseFeedback} ref={feedbackPopupRef} className="feedback-popup">
            {feedbackQandA.answer && feedbackQandA.question && (
              <>
                <ChatFeedback question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
                <RegisterFormLoader />
              </>
            )}
          </dialog>
        </div>
      )}

      <style jsx>{`
        .chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 954px;
          background-color: #f4faff;
          margin: 0px auto;
          position: relative;
          overflow: hidden;
          padding-bottom: 90px;
        }

        .chat__messages-wrapper {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 20px;
        }

        .chat__form-wrapper {
          position: fixed;
          width: calc(100% - 20px);
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          z-index: 1;
        }

        .chat__form {
          padding-bottom: 10px;
        }

        .feedback-popup {
          background: white;
          border-radius: 8px;
          border: none;
          max-height: 1000px;
          width: 656px;
          margin: auto;
          overflow: hidden;
        }

        .chat__home {
          min-height: inherit;
          display: flex;
          justify-content: center;
          position: relative;
        }

        @media (min-width: 768px) {
          .chat__home {
            padding-top: 12%;
          }
        }

        @media (min-width: 1024px) {
          .chat__form-wrapper {
            width: 989px;
          }

          .chat__form {
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default Chat;
