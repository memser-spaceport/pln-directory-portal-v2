import React, { useCallback, useEffect, useRef, useState } from 'react';

import s from './AiChatPanel.module.scss';
import { ChatPanelHeader } from '@/components/core/application-search/components/AiChatPanel/components/ChatPanelHeader';
import { EmptyChatView } from '@/components/core/application-search/components/AiChatPanel/components/EmptyChatView';
import { ChatSubheader } from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import { DAILY_CHAT_LIMIT, TOAST_MESSAGES } from '@/utils/constants';
import { checkRefreshToken, getChatCount, updateChatCount, updateLimitType } from '@/utils/husky.utlils';
import ChatInput from '@/components/page/husky/chat-input';
import { generateUUID, getUniqueId, isMobileDevice } from '@/utils/common.utils';
import { getUserCredentials } from '@/utils/auth.utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { toast } from 'react-toastify';
import { IUserInfo } from '@/types/shared.types';
// import { createHuskyThread, createThreadTitle } from '@/services/husky.service';
import { ChatHistory } from '@/components/core/application-search/components/AiChatPanel/components/ChatHistory';
import Messages from '@/components/page/husky/messages';
import ChatFeedback from '@/components/page/husky/chat-feedback';
import RegisterFormLoader from '@/components/core/register/register-form-loader';

interface Props {
  isLoggedIn?: boolean;
  id?: string;
  from?: string;
  userInfo?: IUserInfo;
  isOwnThread?: boolean;
  initialPrompt?: string;
}

export const AiChatPanel = ({ isLoggedIn = false, id, from, userInfo, isOwnThread, initialPrompt }: Props) => {
  const [feedbackQandA, setFeedbackQandA] = useState({ question: '', answer: '' });
  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [type, setType] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest'>(); // daily limit
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackPopupRef = useRef<HTMLDialogElement>(null);
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const [question, setQuestion] = useState('');
  const messagesRef = useRef<any[]>(initialMessages ?? []);
  const threadUidRef = useRef<string | undefined>(id);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<string>(from ?? '');
  const endRef = useRef<HTMLDivElement | null>(null);
  const analytics = useHuskyAnalytics();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

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
      followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
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

  // scroll to the bottom of the chat when new message is added
  useEffect(() => {
    console.log('handle autoscroll', chatIsLoading);
    if (chatIsLoading && endRef.current && autoScrollEnabled) {
      endRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatIsLoading, autoScrollEnabled]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const isAtBottom = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;

      setAutoScrollEnabled(isAtBottom);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

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
        //
        // if ((hasRefreshToken && messagesRef.current.length === 0) || (hasRefreshToken && fromRef.current === 'blog' && messagesRef.current.length === 1)) {
        //   const threadResponse = await createHuskyThread(authToken, threadId); // create new thread
        //   if (threadResponse) {
        //     const [titleResponse] = await Promise.all([createThreadTitle(authToken, threadId, question), submitChat(submitParams)]); //create thread title
        //     if (titleResponse) {
        //       document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        //     }
        //   }
        // } else {
        //   submitChat(submitParams);
        //   document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        // }
        submitChat(submitParams);
        document.dispatchEvent(new Event('refresh-husky-history')); // refresh sidebar history
        analytics.trackAiResponse('success', type, false, question);
      } catch (error) {
        console.error(`Error in ${type} submission:`, error);
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        analytics.trackAiResponse('error', type, false, question);
      }
    },
    [isLoggedIn, checkAndSetThreadId, addMessage, submitChat, analytics],
  );

  // handle husky input submission
  const onHuskyInput = (query: string) => handleChatSubmission({ question: query, type: 'user-input' });

  // handle submit by clicking the send button
  const submitForm = () => {
    const trimmedValue = textareaRef.current?.value.trim();

    if (!trimmedValue) {
      return;
    }

    onHuskyInput(trimmedValue);

    textareaRef.current!.value = '';
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

  const onFollowupClicked = (question: string) => {
    if (chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')) {
      return;
    }

    handleChatSubmission({ question, type: 'followup' });
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

  // handle copy answer by clicking the copy button
  const onCopyAnswer = async (answer: string) => {
    analytics.trackAnswerCopy(answer);
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

  useEffect(() => {
    if (initialPrompt) {
      textareaRef.current!.value = initialPrompt;
      textareaRef.current!.focus();
    }
  }, [initialPrompt]);

  return (
    <div className={s.root}>
      <ChatPanelHeader />
      <ChatSubheader isEmpty lastQuery="" isShowHistory={showHistory} onToggleHistory={() => setShowHistory(!showHistory)} />
      {showHistory ? (
        <>
          <ChatHistory
            onSelect={(q) => {
              setShowHistory(false);
              onHuskyInput(q);
            }}
          />
        </>
      ) : (
        <>
          {messages?.length > 0 ? (
            <div className={s.messagesWrapper} ref={chatContainerRef}>
              <Messages
                messages={messages}
                onFollowupClicked={onFollowupClicked}
                isAnswerLoading={isAnswerLoading}
                isLoadingObject={chatIsLoading || isAnswerLoading || (!isOwnThread && fromRef.current === 'detail')}
                onFeedback={onFeedback}
                onRegenerate={onRegenerate}
                onCopyAnswer={onCopyAnswer}
                onQuestionEdit={onQuestionEdit}
                threadId={threadUidRef.current}
              />
              <div ref={endRef} />
            </div>
          ) : (
            <EmptyChatView />
          )}
          <form className={s.chatInputWrapper}>
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
          <dialog onClose={onCloseFeedback} ref={feedbackPopupRef} className="feedback-popup">
            {feedbackQandA.answer && feedbackQandA.question && (
              <>
                <ChatFeedback question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
                <RegisterFormLoader />
              </>
            )}
          </dialog>
        </>
      )}
    </div>
  );
};
