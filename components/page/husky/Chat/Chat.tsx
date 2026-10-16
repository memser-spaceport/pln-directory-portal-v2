'use client';

import { z } from 'zod';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';

import { huskySourceRefSchema } from '@/services/husky/hooks/useHuskyChat';
import { DAILY_CHAT_LIMIT, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';

import { getUserCredentials } from '@/utils/auth.utils';
import { toast } from '@/components/core/ToastContainer';
import { generateUUID, getUniqueId, triggerLoader } from '@/utils/common.utils';
import { createHuskyThread, createThreadTitle, duplicateThread } from '@/services/husky.service';
import { getChatCount, updateLimitType, updateChatCount, checkRefreshToken } from '@/utils/husky.utlils';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useUnifiedSearchAnalytics, type AiQuerySubmitType } from '@/analytics/unified-search.analytics';

import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';

import { OPEN_VISIT_CHAT_EVENT, PENDING_FOLLOW_UP_KEY_PREFIX } from '../constants/visitChats';

import { saveVisitChat } from '../utils/saveVisitChat';

import { useSidebar } from '../hooks/useSidebar';

import { Messages } from './components/Messages';
import { ChatHome } from './components/ChatHome';
import { ChatTitleBar } from './components/ChatTitleBar';
import { ChatComposer } from './components/ChatComposer';

import s from './Chat.module.scss';

interface Props {
  id?: string;
  isLoggedIn: boolean;
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

export const Chat = (props: Props) => {
  const { id, isLoggedIn, initialMessages, setInitialMessages, from, setType, isOwnThread, threadOwner, title } = props;

  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest'>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  /* The signed-in token for the request `submitChat` is about to send. The API gates
     member-only tools (Investor DB, warm intros, investor profiles) on it, so without
     it every answer on this page is the signed-out one. */
  const tokenRef = useRef<string | null>(null);
  const { state } = useSidebar();
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const messagesRef = useRef<any[]>(initialMessages ?? []);
  const fromRef = useRef<string>(from ?? '');
  const threadUidRef = useRef<string | undefined>(id);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const analytics = useHuskyAnalytics();
  const searchAnalytics = useUnifiedSearchAnalytics();
  const router = useRouter();
  // Someone else's shared chat: a follow-up makes the reader's own copy instead of changing this one.
  const isSharedView = !isOwnThread && from === 'detail';
  const [isContinuingShared, setIsContinuingShared] = useState(false);
  // The thread the title bar shares and deletes: the page's id, or the one a new chat gets on its first question.
  const [openThreadId, setOpenThreadId] = useState(id);
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
    fetch: (url, init) =>
      fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        },
      }),
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

  const addMessage = (question: string, id: string) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        {
          id,
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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    fromRef.current = from ?? '';
  }, [from]);

  useEffect(() => {
    threadUidRef.current = id;
  }, [id, initialMessages]);

  const checkAndSetThreadId = useCallback(() => {
    if (threadUidRef.current && messagesRef.current.length > 0) {
      return threadUidRef.current;
    }
    const newThreadUid = getUniqueId();
    threadUidRef.current = newThreadUid;
    return newThreadUid;
  }, [id]);

  useEffect(() => {
    if (chatError) {
      setMessages((prev) => {
        if (prev.length === 0) {
          return prev;
        }
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
    if (isLoggedIn || isSharedView || chatIsLoading || isAnswerLoading) {
      return;
    }
    const lastMessage = messages[messages.length - 1];
    if (!threadUidRef.current || !lastMessage?.answer || lastMessage?.isError) {
      return;
    }
    if (saveVisitChat({ threadId: threadUidRef.current, messages })) {
      document.dispatchEvent(
        new CustomEvent('refresh-husky-history', { detail: { openThreadId: threadUidRef.current } }),
      );
    }
  }, [messages, chatIsLoading, isAnswerLoading, isLoggedIn, isSharedView]);

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

  const handleChatSubmission = useCallback(
    async ({
      question,
      type,
      submitType = type,
    }: {
      question: string;
      type: 'prompt' | 'followup' | 'user-input';
      submitType?: AiQuerySubmitType;
    }) => {
      try {
        const { userInfo, authToken } = await getUserCredentials(isLoggedIn);
        tokenRef.current = authToken ?? null;
        const hasRefreshToken = checkRefreshToken();

        if (!hasRefreshToken) {
          updateChatCount();

          const countResponse = updateLimitType();
          if (countResponse === 'warn') {
            setLimitReached('warn');
            return;
          }
          if (countResponse) {
            setLimitReached(countResponse);
          }
        }

        const threadId = checkAndSetThreadId();
        setOpenThreadId(threadId);
        const chatUid = generateUUID();
        setQuestion(question);
        addMessage(question, chatUid);

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
          const chatUid = generateUUID();
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

        searchAnalytics.onAiQuerySubmitted(question, 'ai-search-page', submitType);
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
          const threadResponse = await createHuskyThread(authToken, threadId);
          if (threadResponse) {
            const [titleResponse] = await Promise.all([
              createThreadTitle(authToken, threadId, question),
              submitChat(submitParams),
            ]);
            if (titleResponse) {
              document.dispatchEvent(new CustomEvent('refresh-husky-history', { detail: { openThreadId: threadId } }));
            }
          }
        } else {
          submitChat(submitParams);
          document.dispatchEvent(new Event('refresh-husky-history'));
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
      initialMessages,
      chatError,
      chatObject,
      chatIsLoading,
      checkAndSetThreadId,
      addMessage,
      submitChat,
      analytics,
      searchAnalytics,
    ],
  );

  const onHuskyInput = (query: string, submitType: AiQuerySubmitType = 'user-input') =>
    handleChatSubmission({ question: query, type: 'user-input', submitType });

  const onRegenerate = (query: string) => {
    if (chatIsLoading) {
      return;
    }
    onHuskyInput(query, 'regenerate');
    analytics.trackRegenerate();
  };

  const onFollowupClicked = (question: string) => {
    if (chatIsLoading || isAnswerLoading) {
      return;
    }
    if (isSharedView) {
      onSharedFollowUp(question);
      return;
    }
    handleChatSubmission({ question, type: 'followup' });
  };

  const onQuestionEdit = (question: string) => {
    if (chatIsLoading || isAnswerLoading) {
      return;
    }
    analytics.trackQuestionEdit(question);
    textareaRef.current!.value = question;
    textareaRef.current!.focus();
  };

  const onCopyAnswer = async (answer: string) => {
    analytics.trackAnswerCopy(answer);
  };

  const submitForm = () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      return;
    }
    if (isSharedView) {
      // The text stays in the input until the copy exists, so a failed send loses nothing.
      onSharedFollowUp(trimmedValue);
      return;
    }
    onHuskyInput(trimmedValue);
    textareaRef.current!.value = '';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitForm();
    }
  };

  const onStopStreaming = useCallback(() => {
    analytics.trackHuskyChatStopBtnClicked(question);
    stopChat();
  }, [question]);

  const onSharedFollowUp = useCallback(
    async (followUp: string) => {
      if (isContinuingSharedRef.current) {
        return;
      }
      // Signed out at the daily limit, the copy could not ask the follow-up: make no copy.
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
          guestUserId = Cookies.get('guestId');

          if (!guestUserId) {
            guestUserId = generateUUID();

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
        sessionStorage.setItem(PENDING_FOLLOW_UP_KEY_PREFIX + duplicateThreadResponse.threadId, followUp);
        textareaRef.current!.value = '';
        router.push(`${PAGE_ROUTES.HUSKY}/${duplicateThreadResponse.threadId}`);
        document.dispatchEvent(new Event('refresh-husky-history'));
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
    [router, isLoggedIn, id, analytics],
  );

  // A question handed over by another page: the copy of a shared chat, or the AI Search entry points.
  useEffect(() => {
    const followUpKey = PENDING_FOLLOW_UP_KEY_PREFIX + id;
    const followUp = id ? sessionStorage.getItem(followUpKey) : null;
    if (followUp) {
      sessionStorage.removeItem(followUpKey);
      handleChatSubmission({ question: followUp, type: 'user-input' });
      return;
    }
    const storedInput = localStorage.getItem('input');
    if (storedInput) {
      handleChatSubmission({ question: storedInput, type: 'user-input' });
      localStorage.removeItem('input');
    }
  }, []);

  useEffect(() => {
    if (isAnswerLoading && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isAnswerLoading]);

  if (messages.length === 0) {
    return (
      <>
        <ChatTitleBar />
        <div className={s.home}>
          <ChatHome
            onSubmit={onHuskyInput}
            setMessages={setInitialMessages ?? (() => {})}
            setType={setType ?? (() => {})}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <ChatTitleBar
        chat={{
          threadId: openThreadId,
          title: title || messages[0]?.question,
          sharedBy: isSharedView ? threadOwner : undefined,
        }}
      />
      {messages?.length > 0 && (
        <div className={s.root} ref={chatContainerRef}>
          <div className={s.messages}>
            <Messages
              messages={messages}
              onFollowupClicked={onFollowupClicked}
              isAnswerLoading={isAnswerLoading}
              statusLine={chatObject?.steps?.filter(Boolean).at(-1)}
              isLoadingObject={chatIsLoading || isAnswerLoading}
              onRegenerate={isSharedView ? undefined : onRegenerate}
              onCopyAnswer={onCopyAnswer}
              onQuestionEdit={onQuestionEdit}
              isStreaming={chatIsLoading}
              threadId={openThreadId}
              showRating={isLoggedIn}
              canRate={isOwnThread || from !== 'detail'}
            />
          </div>

          <div data-state={state} className={s.formWrapper}>
            <form className={s.form}>
              {limitReached && (
                <HuskyLimitStrip
                  mode="chat"
                  count={DAILY_CHAT_LIMIT - getChatCount()}
                  type={limitReached}
                  from="husky-chat"
                />
              )}
              <ChatComposer
                ref={textareaRef}
                placeholder="Go ahead, ask anything!"
                rows={1}
                autoFocus
                onKeyDown={handleKeyDown}
                onTextSubmit={submitForm}
                onStopStreaming={onStopStreaming}
                isAnswerLoading={isAnswerLoading || isContinuingShared}
                isLoadingObject={chatIsLoading}
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
};
