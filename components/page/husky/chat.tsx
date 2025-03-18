'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';

import Messages from './messages';
import ChatFeedback from './chat-feedback';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import { DAILY_CHAT_LIMIT, TOAST_MESSAGES } from '@/utils/constants';
import { generateUUID, getUniqueId, isMobileDevice, triggerLoader } from '@/utils/common.utils';
import ChatHome from './chat-home';
import { IAnalyticsUserInfo } from '@/types/shared.types';
import { getUserCredentials } from '@/utils/auth.utils';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import { getChatCount, updateLimitType, updateChatCount, checkRefreshToken } from '@/utils/husky.utlils';
import ChatInput from './chat-input';
import { createHuskyThread, createThreadTitle, duplicateThread } from '@/services/husky.service';
import { useSidebar } from './sidebar';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { toast } from 'react-toastify';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
interface ChatProps {
  id?: string;
  isLoggedIn: boolean;
  userInfo: IAnalyticsUserInfo;
  initialMessages: any;
  from?: string;
  setType?: (type: string) => void;
  setInitialMessages?: (messages: any[]) => void;
  isOwnThread?: boolean;
  threadOwner?: {
    name: string;
    image: string;
  };
}

const Chat: React.FC<ChatProps> = ({ id, isLoggedIn, userInfo, initialMessages, setInitialMessages, from, setType, isOwnThread, threadOwner }) => {
  const [feedbackQandA, setFeedbackQandA] = useState({ question: '', answer: '' });
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest'>(); // daily limit
  const feedbackPopupRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { state } = useSidebar();
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const messagesRef = useRef<any[]>(initialMessages ?? []);
  const fromRef = useRef<string>(from ?? '');
  const threadUidRef = useRef<string | undefined>(id);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const {
    object: chatObject,
    isLoading: chatIsLoading,
    submit: submitChat,
    error: chatError,
    stop: stopChat,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/contextual`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      content: z.string(),
      followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
      actions: z
        .array(
          z.object({
            name: z.string(),
            directoryLink: z.string(),
            type: z.string(),
          })
        )
        .optional(),
    }),
    onFinish: async () => {
      setIsAnswerLoading(false);
    },
    onError: (error) => {
      console.error('chatError', error);
      setIsAnswerLoading(false);
    },
  });

  const addMessage = (question: string) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        {
          question,
          answer: '',
          followUpQuestions: [],
          sources: [],
          actions: [],
          sql: [],
        },
      ];
      messagesRef.current = newMessages;
      return newMessages;
    });
    setIsAnswerLoading(true);
  };

  // Update messagesRef whenever messages state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Update fromRef whenever from prop changes
  useEffect(() => {
    fromRef.current = from ?? '';
  }, [from]);

  // Update threadUidRef whenever threadUid prop changes
  useEffect(() => {
    threadUidRef.current = id;
  }, [id, initialMessages]);

  // Checks and sets the thread ID for the current chat session
  const checkAndSetThreadId = useCallback(() => {
    if (threadUidRef.current && messagesRef.current.length > 0) {
      return threadUidRef.current;
    }
    const newThreadUid = getUniqueId();
    // setThreadUid(newThreadUid);
    threadUidRef.current = newThreadUid;
    return newThreadUid;
  }, [id]);

  useEffect(() => {
    if (chatError) {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((msg, index) => (index === prev.length - 1 ? { ...msg, answer: '', isError: true } : msg));
      });
    }

    if (chatObject?.content && chatIsLoading) {
      setIsAnswerLoading(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: chatObject?.content || newMessages[lastIndex]?.answer || '',
          followUpQuestions: chatObject?.followUpQuestions || newMessages[lastIndex]?.followUpQuestions || [],
          sources: chatObject?.sources || newMessages[lastIndex]?.sources || [],
          actions: chatObject?.actions || newMessages[lastIndex]?.actions || [],
          sql: [],
        };

        return newMessages;
      });
    }
  }, [chatObject, chatIsLoading, chatError]);

  useEffect(() => {
    setMessages([...initialMessages]);
  }, [initialMessages]);

  // handle all chat submission
  const handleChatSubmission = useCallback(
    async ({ question, type }: { question: string; type: 'prompt' | 'followup' | 'user-input'; previousContext?: { question: string; answer: string } | null }) => {
      try {
        const { userInfo, authToken } = await getUserCredentials(isLoggedIn);
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

        const threadId = checkAndSetThreadId();
        const chatUid = generateUUID(); // check and set the thread ID for the current chat session
        setQuestion(question);
        addMessage(question); // add new chat message

        //
        const submitParams = {
          threadId,
          chatId: chatUid,
          question,
          ...(userInfo?.name && { name: userInfo?.name }),
          ...(userInfo?.email && { email: userInfo?.email }),
          ...(userInfo?.uid && { directoryId: userInfo?.uid }),
        };

        if (fromRef.current === 'blog' && messagesRef.current.length === 1) {
          const message = messagesRef.current[messagesRef.current.length - 1];
          const chatUid = generateUUID(); // check and set the thread ID for the current chat session
          submitParams.chatSummary = {
            user: message.question,
            system: message.answer,
            threadId,
            chatId: chatUid,
            sources: message.sources,
            actions: [],
            followUpQuestions: message.followUpQuestions,
          };
        }

        analytics.trackAiResponse('initiated', type, false, question);

        if (!hasRefreshToken) {
          submitChat(submitParams);
          analytics.trackAiResponse('success', type, false, question);
          return;
        }

        if ((hasRefreshToken && messagesRef.current.length === 0) || (hasRefreshToken && fromRef.current === 'blog' && messagesRef.current.length === 1)) {
          const threadResponse = await createHuskyThread(authToken, threadId); // create new thread
          if (threadResponse) {
            const [titleResponse] = await Promise.all([createThreadTitle(authToken, threadId, question), submitChat(submitParams)]); //create thread title
            if (titleResponse) {
              document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
            }
          }
        } else {
          submitChat(submitParams);
          document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        }
        analytics.trackAiResponse('success', type, false, question);
      } catch (error) {
        console.error(`Error in ${type} submission:`, error);
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        analytics.trackAiResponse('error', type, false, question);
      }
    },
    [messages, id, from, isLoggedIn, userInfo, initialMessages, chatError, chatObject, chatIsLoading, checkAndSetThreadId, addMessage, submitChat, analytics]
  );

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
      if (chatIsLoading || (!isOwnThread && fromRef.current === 'detail')) {
        return;
      }
      onHuskyInput(query);
      analytics.trackRegenerate();
    },
    [chatIsLoading]
  );

  const onFollowupClicked = (question: string) => {
    if (chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')) {
      return;
    }
    handleChatSubmission({ question, type: 'followup' });
  };

  // handle question edit by clicking the edit button
  const onQuestionEdit = useCallback((question: string) => {
    if (chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')) {
      return;
    }
    analytics.trackQuestionEdit(question);
    textareaRef.current!.value = question;
    textareaRef.current!.focus();
  }, []);

  // handle copy answer by clicking the copy button
  const onCopyAnswer = async (answer: string) => {
    analytics.trackAnswerCopy(answer);
  };

  // handle submit by clicking the send button
  const submitForm = () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      return;
    }
    onHuskyInput(trimmedValue);
    textareaRef.current!.value = '';
  };

  // handle feedback submission
  const onFeedback = async (question: string, answer: string) => {
    if (chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')) {
      return;
    }
    analytics.trackFeedbackClick(question, answer);
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

  // handle stop streaming
  const onStopStreaming = useCallback(() => {
    analytics.trackHuskyChatStopBtnClicked(question);
    stopChat();
  }, [question]);

  // handle continue conversation button click for shared conversation
  const handleContinueConversation = useCallback(async () => {
    try {
      analytics.trackContinueConversation(id ?? '');
      triggerLoader(true);

      let guestUserId;
      if (!isLoggedIn) {
        // Get guestId from cookie or create a new one if it doesn't exist
        guestUserId = Cookies.get('guestId');

        if (!guestUserId) {
          guestUserId = generateUUID();

          // Set cookie with expiration at midnight
          const midnight = new Date();
          midnight.setHours(23, 59, 59, 999);

          Cookies.set('guestId', guestUserId, {
            expires: midnight,
            path: '/',
          });
        }
      }

      const { authToken } = await getUserCredentials(isLoggedIn);

      if (!isOwnThread && fromRef.current === 'detail') {
        analytics.trackThreadDuplicateStatus(id ?? '', 'initiated');
        const duplicateThreadResponse = await duplicateThread(authToken, id ?? '', guestUserId);
        if (duplicateThreadResponse.isError) {
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          analytics.trackThreadDuplicateStatus(id ?? '', 'failed');
          return;
        }
        router.push(`/husky/chat/${duplicateThreadResponse.threadId}`);
        document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        analytics.trackThreadDuplicateStatus(id ?? '', 'success');
      }
    } catch (error) {
      console.error('Error duplicating thread:', error);
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      analytics.trackThreadDuplicateStatus(id ?? '', 'failed');
    } finally {
      triggerLoader(false);
    }
  }, [router, isLoggedIn, isOwnThread, fromRef, id]);

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

  if (messages.length === 0) {
    return (
      <>
        <div className="chat__home">
          <ChatHome onSubmit={onHuskyInput} setMessages={setInitialMessages ?? (() => {})} setType={setType ?? (() => {})} />
        </div>
        <style jsx>{`
          .chat__home {
            min-height: inherit;
            display: flex;
            justify-content: center;
            position: relative;
          }

          @media (min-width: 768px) {
            .chat__home {
              padding-top: 12vh;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {messages?.length > 0 && (
        <div className="chat" ref={chatContainerRef}>
          {!isOwnThread && threadOwner?.name && fromRef.current === 'detail' && (
            <div className="chat__header">
              <div className="chat__header-info">
                <span className="chat__header-info-text">Shared conversation from</span>
                <img title={threadOwner?.name} className="chat__header-info-avatar" src={threadOwner?.image || '/icons/default_profile.svg'} alt="user" />
              </div>
            </div>
          )}
          <div className="chat__messages-wrapper">
            <Messages
              messages={messages}
              onFollowupClicked={onFollowupClicked}
              isAnswerLoading={isAnswerLoading}
              isLoadingObject={chatIsLoading}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onCopyAnswer={onCopyAnswer}
              onQuestionEdit={onQuestionEdit}
            />
          </div>

          {!isOwnThread && fromRef.current === 'detail' ? (
            <div data-state={isLoggedIn ? state : ''} className="chat__new-conversation-wrapper">
              <div className="chat__new-conversation-info">
                <div className="chat__new-conversation-content">
                  <div className="chat__new-conversation-icon">
                    <img src="/icons/husky/husky-face-trans.svg" alt="Husky icon" />
                  </div>
                  <div className="chat__new-conversation-text">Click &ldquo;Continue Conversation&ldquo; to start a new chat instance with this conversation</div>
                </div>
                <button className="chat__new-conversation-button" onClick={handleContinueConversation}>
                  Continue Conversation
                </button>
              </div>
            </div>
          ) : (
            <div data-state={isLoggedIn ? state : ''} className="chat__form-wrapper">
              <form className="chat__form">
                {limitReached && <HuskyLimitStrip mode="chat" count={DAILY_CHAT_LIMIT - getChatCount()} type={limitReached} from="husky-chat" />}
                <ChatInput
                  ref={textareaRef}
                  placeholder="Go ahead, ask anything!"
                  rows={isMobileDevice() ? 1 : 2}
                  autoFocus
                  onKeyDown={handleKeyDown}
                  onTextSubmit={submitForm}
                  onStopStreaming={onStopStreaming}
                  isAnswerLoading={isAnswerLoading}
                  isLoadingObject={chatIsLoading}
                  isLimitReached={limitReached === 'warn' || limitReached === 'finalRequest'}
                />
              </form>
            </div>
          )}

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
          padding: 26px 0px 90px 0px;
        }

        .chat__header {
          margin-left: 10px;
        }

        .chat__header-info {
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          width: fit-content;
          background-color: #fff;
        }

        .chat__header-info-text {
          color: #475569;
          font-weight: 500;
          font-size: 14px;
          line-height: 14px;
        }

        .chat__header-info-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
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
          display: flex;
          justify-content: center;
        }

        .chat__form {
          padding-bottom: 10px;
          width: 100%;
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

        .chat__new-conversation-wrapper {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .chat__new-conversation-info {
          display: flex;
          justify-content: space-between;
          flex-direction: column;
          gap: 12px;
          background-color: #000000;
          padding: 20px;
          border: 1px solid #cbd5e1;
          width: 721px;
        }

        .chat__new-conversation-icon {
          display: none;
        }

        .chat__new-conversation-content {
          display: flex;
          gap: 12px;
          max-width: 100%;
          align-items: center;
        }

        .chat__new-conversation-text {
          color: #ffffff;
          font-size: 14px;
          line-height: 20px;
          font-weight: 400;
        }

        .chat__new-conversation-button {
          background-color: #156ff7;
          color: white;
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 100%;
          max-width: 194px;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
        }

        .chat__new-conversation-button:hover {
          background-color: #1d4ed8;
        }

        @media (min-width: 768px) {
          .chat__form-wrapper {
            width: 989px;
          }

          .chat__form {
            padding: 20px;
          }

          .chat__form-wrapper[data-state='expanded'] {
            left: calc(50% + 150px);
          }

          .chat__form-wrapper[data-state='collapsed'] {
            left: calc(50% + 32px);
          }

          .chat__new-conversation-wrapper {
            bottom: 20px;
          }

          .chat__new-conversation-wrapper[data-state='expanded'] {
            left: calc(50% + 150px);
          }

          .chat__new-conversation-wrapper[data-state='collapsed'] {
            left: calc(50% + 32px);
          }

          .chat__new-conversation-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #ffffff33;
            border-radius: 50%;
          }

          .chat__header {
            margin-left: 20px;
          }

          .chat__new-conversation-info {
            flex-direction: row;
            border-radius: 8px;
            gap: 21px;
          }

          .chat__new-conversation-icon img {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </>
  );
};

export default Chat;
