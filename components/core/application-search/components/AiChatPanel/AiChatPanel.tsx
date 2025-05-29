import React, { useCallback, useRef, useState } from 'react';

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
import { createHuskyThread, createThreadTitle } from '@/services/husky.service';
import { ChatHistory } from '@/components/core/application-search/components/AiChatPanel/components/ChatHistory';

interface Props {
  isLoggedIn?: boolean;
  id?: string;
  from?: string;
  userInfo?: IUserInfo;
}

export const AiChatPanel = ({ isLoggedIn = false, id, from, userInfo }: Props) => {
  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [type, setType] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest'>(); // daily limit
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const [question, setQuestion] = useState('');
  const messagesRef = useRef<any[]>(initialMessages ?? []);
  const threadUidRef = useRef<string | undefined>(id);
  const fromRef = useRef<string>(from ?? '');
  const analytics = useHuskyAnalytics();

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

  console.log(chatObject);

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

  return (
    <div className={s.root}>
      <ChatPanelHeader />
      <ChatSubheader isEmpty lastQuery="" isShowHistory={showHistory} onToggleHistory={() => setShowHistory(!showHistory)} />
      {showHistory ? (
        <>
          <ChatHistory onSelect={(q) => onHuskyInput(q)} />
        </>
      ) : (
        <>
          <EmptyChatView />
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
        </>
      )}
    </div>
  );
};
