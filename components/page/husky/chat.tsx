'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';

import Messages from './messages';
import ChatFeedback from './chat-feedback';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import { DAILY_CHAT_LIMIT, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
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
import { toast } from '@/components/core/ToastContainer';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { huskySourceRefSchema } from '@/services/husky/hooks/useHuskyChat';
import { useRouter } from 'next/navigation';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { OPEN_VISIT_CHAT_EVENT, saveVisitChat } from '@/utils/husky-visit-chats';

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
  title?: string;
}

const Chat: React.FC<ChatProps> = ({
  id,
  isLoggedIn,
  userInfo,
  initialMessages,
  setInitialMessages,
  from,
  setType,
  isOwnThread,
  threadOwner,
  title,
}) => {
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
  const unifiedSearchAnalytics = useUnifiedSearchAnalytics();
  const router = useRouter();
  // Someone else's shared chat: a follow-up makes the reader's own copy instead of changing this one.
  const isSharedView = !isOwnThread && from === 'detail';
  const [isContinuingShared, setIsContinuingShared] = useState(false);
  const isContinuingSharedRef = useRef(false);

  const {
    object: chatObject,
    isLoading: chatIsLoading,
    submit: submitChat,
    error: chatError,
    stop: stopChat,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/contextual-tools`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      content: z.string(),
      steps: z.array(z.string()).optional(),
      followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
      sourceRefs: z.array(huskySourceRefSchema).optional(),
      actions: z
        .array(
          z.object({
            name: z.string(),
            directoryLink: z.string(),
            type: z.string(),
          }),
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
          sourceRefs: [],
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
          sourceRefs: chatObject?.sourceRefs || newMessages[lastIndex]?.sourceRefs || [],
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

  // Signed out, chats are not saved on the server: keep this visit's chats for the History rail.
  useEffect(() => {
    if (isLoggedIn || isSharedView || chatIsLoading || isAnswerLoading) return;
    const lastMessage = messages[messages.length - 1];
    if (!threadUidRef.current || !lastMessage?.answer || lastMessage?.isError) return;
    if (saveVisitChat({ threadId: threadUidRef.current, messages })) {
      // refresh sidebar history and mark this chat as the open one
      document.dispatchEvent(
        new CustomEvent('refresh-husky-history', { detail: { visitThreadId: threadUidRef.current } }),
      );
    }
  }, [messages, chatIsLoading, isAnswerLoading, isLoggedIn, isSharedView]);

  // Signed out, opening another chat from the rail while an answer streams must not write that answer into it.
  useEffect(() => {
    const handleOpenVisitChat = () => {
      if (chatIsLoading || isAnswerLoading) {
        stopChat();
        setIsAnswerLoading(false);
      }
    };
    document.addEventListener(OPEN_VISIT_CHAT_EVENT, handleOpenVisitChat);
    return () => document.removeEventListener(OPEN_VISIT_CHAT_EVENT, handleOpenVisitChat);
  }, [chatIsLoading, isAnswerLoading, stopChat]);

  // handle all chat submission
  const handleChatSubmission = useCallback(
    async ({
      question,
      type,
    }: {
      question: string;
      type: 'prompt' | 'followup' | 'user-input';
      previousContext?: { question: string; answer: string } | null;
    }) => {
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

        if (
          (hasRefreshToken && messagesRef.current.length === 0) ||
          (hasRefreshToken && fromRef.current === 'blog' && messagesRef.current.length === 1)
        ) {
          const threadResponse = await createHuskyThread(authToken, threadId); // create new thread
          if (threadResponse) {
            const [titleResponse] = await Promise.all([
              createThreadTitle(authToken, threadId, question),
              submitChat(submitParams),
            ]); //create thread title
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
    [
      messages,
      id,
      from,
      isLoggedIn,
      userInfo,
      initialMessages,
      chatError,
      chatObject,
      chatIsLoading,
      checkAndSetThreadId,
      addMessage,
      submitChat,
      analytics,
    ],
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
    [chatIsLoading],
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
    if (isSharedView) {
      // the text stays in the input until the copy exists, so a failed send loses nothing
      onSharedFollowUp(trimmedValue);
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

  // handle a follow-up asked on someone else's shared chat: copy the chat, open the copy, and ask it there
  const onSharedFollowUp = useCallback(
    async (followUp: string) => {
      if (isContinuingSharedRef.current) {
        return;
      }
      // signed out at the daily limit, the copy could not ask the follow-up: make no copy
      if (!checkRefreshToken() && getChatCount() >= DAILY_CHAT_LIMIT) {
        setLimitReached('warn');
        return;
      }
      isContinuingSharedRef.current = true;
      setIsContinuingShared(true);
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

        analytics.trackThreadDuplicateStatus(id ?? '', 'initiated');
        const duplicateThreadResponse = await duplicateThread(authToken, id ?? '', guestUserId);
        if (!duplicateThreadResponse || duplicateThreadResponse.isError || !duplicateThreadResponse.threadId) {
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          analytics.trackThreadDuplicateStatus(id ?? '', 'failed');
          return;
        }
        // the copy's page asks the follow-up when it opens
        localStorage.setItem('input', followUp);
        if (textareaRef.current) {
          textareaRef.current.value = '';
        }
        unifiedSearchAnalytics.onSharedChatContinued(id ?? '', duplicateThreadResponse.threadId);
        router.push(`${PAGE_ROUTES.HUSKY}/${duplicateThreadResponse.threadId}`);
        document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        analytics.trackThreadDuplicateStatus(id ?? '', 'success');
      } catch (error) {
        console.error('Error duplicating thread:', error);
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        analytics.trackThreadDuplicateStatus(id ?? '', 'failed');
      } finally {
        triggerLoader(false);
        isContinuingSharedRef.current = false;
        setIsContinuingShared(false);
      }
    },
    [router, isLoggedIn, id, analytics, unifiedSearchAnalytics],
  );

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
          <ChatHome
            onSubmit={onHuskyInput}
            setMessages={setInitialMessages ?? (() => {})}
            setType={setType ?? (() => {})}
          />
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
          {isSharedView && threadOwner?.name && (
            <div className="chat__header">
              {title && (
                <h1 className="chat__header-title" title={title}>
                  {title}
                </h1>
              )}
              <div className="chat__header-info">
                <img
                  className="chat__header-info-avatar"
                  src={threadOwner?.image || '/icons/default_profile.svg'}
                  alt=""
                  width={16}
                  height={16}
                />
                <span className="chat__header-info-text">Shared by {threadOwner.name}</span>
                <span className="chat__header-info-hint">· Ask a follow-up to make your own copy</span>
              </div>
            </div>
          )}
          <div className="chat__messages-wrapper">
            <Messages
              messages={messages}
              onFollowupClicked={onFollowupClicked}
              isAnswerLoading={isAnswerLoading}
              statusLine={chatObject?.steps?.filter(Boolean).at(-1)}
              isLoadingObject={chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onCopyAnswer={onCopyAnswer}
              onQuestionEdit={onQuestionEdit}
            />
          </div>

          <div data-state={state} className="chat__form-wrapper">
            <form className="chat__form">
              {limitReached && (
                <HuskyLimitStrip
                  mode="chat"
                  count={DAILY_CHAT_LIMIT - getChatCount()}
                  type={limitReached}
                  from="husky-chat"
                />
              )}
              <ChatInput
                ref={textareaRef}
                placeholder="Go ahead, ask anything!"
                rows={isMobileDevice() ? 1 : 2}
                autoFocus
                onKeyDown={handleKeyDown}
                onTextSubmit={submitForm}
                onStopStreaming={onStopStreaming}
                isAnswerLoading={isAnswerLoading || isContinuingShared}
                isLoadingObject={chatIsLoading}
                isLimitReached={limitReached === 'warn' || limitReached === 'finalRequest'}
              />
            </form>
          </div>

          <dialog onClose={onCloseFeedback} ref={feedbackPopupRef} className="feedback-popup">
            {feedbackQandA.answer && feedbackQandA.question && (
              <>
                <ChatFeedback
                  question={feedbackQandA.question}
                  answer={feedbackQandA.answer}
                  onClose={onCloseFeedback}
                />
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
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0 10px 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(27, 56, 96, 0.12);
          min-width: 0;
        }

        .chat__header-title {
          margin: 0;
          color: #0f172a;
          font-weight: 600;
          font-size: 16px;
          line-height: 24px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat__header-info {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #475569;
          font-size: 12px;
          line-height: 16px;
        }

        .chat__header-info-text {
          flex-shrink: 0;
          font-weight: 500;
        }

        .chat__header-info-hint {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #8897ae;
          display: none;
        }

        .chat__header-info-avatar {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
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

        @media (min-width: 768px) {
          .chat__header {
            margin: 0 20px 16px;
          }

          .chat__header-info-hint {
            display: inline;
          }

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
        }
      `}</style>
    </>
  );
};

export default Chat;
