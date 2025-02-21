'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Messages from './messages';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import ChatFeedback from './chat-feedback';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import TextArea from './chat-input';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import Cookies from 'js-cookie';
import { generateUUID, getParsedValue, getUniqueId } from '@/utils/common.utils';
import ChatHome from './chat-home';
import { useMessages } from '@/hooks/useMessages';
import { z } from 'zod';
import { experimental_useObject as useObject } from '@ai-sdk/react';


interface ChatProps {
  isLoggedIn: boolean;
  userInfo: any;
  initialMessages: any;
}


const Chat: React.FC<ChatProps> = ({ isLoggedIn, userInfo, initialMessages }) => {
  // const [threadId, setThreadId] = useState<string>('aaa'); // thread ID
  const threadIdRef = useRef<string>('aaa');

  console.log("messages2", threadIdRef.current);
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = React.useState('');
  const [feedbackQandA, setFeedbackQandA] = useState({ question: '', answer: '' });
  const feedbackPopupRef = useRef<HTMLDialogElement>(null);
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest' | 'close'>(); // daily limit
  const COOKIE_NAME = 'dailyChats';
  const chatContainerRef = useRef<HTMLDivElement>(null);


  const getAdditionalInfo = async (threadId: string) => {
    console.log("Getting additional info for uid:", threadId);
    if (threadId) {
      try {
        const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/husky/chat/${threadId}/additional-info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const additionalInfo = await response.json();
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              followUpQuestions: additionalInfo.followUpQuestions || newMessages[lastIndex].followUpQuestions,
              actions: additionalInfo.actions || newMessages[lastIndex].actions,
            };
            return newMessages;
          });
        }
      } catch (error) {
        console.error('Error fetching additional info:', error);
      }
    }
  };


  const {
    object,
    isLoading: isLoadingObject,
    submit,
    error,
    stop
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/contextual`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      content: z.string(),
    //   followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
    //   actions: z
    //     .array(
    //       z.object({
    //         name: z.string(),
    //         directoryLink: z.string(),
    //         type: z.string(),
    //       })
    //     )
        // .optional(),
    }),
    onFinish: ()=> {
      console.log("onFinish", threadIdRef.current);
      //console.log("getThreadId", getThreadId());
      //getAdditionalInfo();
      getAdditionalInfo(threadIdRef.current);
    },
    onError: (error) => {
      console.error(error);
      setIsAnswerLoading(false);
    },
  });



  const {
    object: analyticalObject,
    error: analyticalError,
    submit: submitAnalytical,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/analytical`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      sql: z.array(z.string()),
    }),
    onFinish: async () => {
    },
    onError: () => {
    },
  });


//   useEffect(() => {
//     if(isLoadingObject === '') {
//       getAdditionalInfo();
//     }
//   }, [threadId, isLoadingObject]);

 
  useEffect(() => {
    if (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: '',
          isError: true,
        };
        return newMessages;
      });
    }

    if ((object?.content && isLoadingObject) || analyticalObject?.sql) {
      setIsAnswerLoading(false);
      setMessages((prev) => {
        if (prev.length === 0) {
          return [
            {
              answer: object?.content || '',
              followUpQuestions: object?.followUpQuestions || [],
              sources: object?.sources || [],
              actions: object?.actions || [],
              sql: analyticalObject || [],
            },
          ];
        }

        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: object?.content || newMessages[lastIndex]?.answer || '',
          followUpQuestions: object?.followUpQuestions || newMessages[lastIndex]?.followUpQuestions || [],
          sources: object?.sources || newMessages[lastIndex]?.sources || [],
          actions: object?.actions || newMessages[lastIndex]?.actions || [],
          sql: analyticalObject || newMessages[lastIndex] || [],
        };

        return newMessages;
      });
    }
  }, [object, analyticalObject, isLoadingObject, error]);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const addMessage = (question: string) => {
    setMessages((prev) => [
      ...prev,
      {
        question,
        answer: '',
        followUpQuestions: [],
        sources: [],
        actions: [],
      },
    ]);
    setIsAnswerLoading(true);
  };

  // const submitWithUid = (params: { uid: string; question: string }) => {
  //   submitAnalytical(params);
  // };



  const onFeedback = async (question: string, answer: string) => {
    feedbackPopupRef.current?.showModal();
    setFeedbackQandA({ question, answer });
  };
  


  const getUserCredentials = async () => {
    if (!isLoggedIn) {
      return {
        authToken: null,
        userInfo: null,
      };
    }

    const { isLoginRequired, newAuthToken, newUserInfo } = await getUserCredentialsInfo();
    if (isLoginRequired) {
      return {
        authToken: null,
        userInfo: null,
      };
    }

    return {
      authToken: newAuthToken,
      userInfo: newUserInfo,
    };
  };

   // Checks and sets the prompt ID for the current chat session
  //  const checkAndSetPromptId = () => {
  //   let chatUid = threadId;
  //   if (!threadId) {
  //     chatUid = generateUUID();
  //     setThreadId(chatUid);
  //   }
  //   return chatUid;
  // };

  const handleChatSubmission = async ({
    question,
    type,
    previousContext = null,
  }: {
    question: string;
    type: 'prompt' | 'followup' | 'user-input';
    previousContext?: { question: string; answer: string } | null;
  }) => {
    try {
      const { userInfo } = await getUserCredentials();

      if (!checkChatLimit(userInfo)) {
        updateChatCount();
      }

      if (!checkChatLimit(userInfo)) {
        const countResponse = updateLimitType();
        if (countResponse === 'warn') {
          setLimitReached('warn');
          return;
        }

        if (countResponse) {
          setLimitReached(countResponse);
        }
      }

      // const chatUid = checkAndSetPromptId();
      const chatUid = getUniqueId();
      threadIdRef.current = chatUid;
      // setThreadId(chatUid);

      addMessage(question);

      const submitParams = {
        uid: chatUid,
        question,
        ...(userInfo?.name && { name: userInfo?.name }),
        ...(userInfo?.email && { email: userInfo?.email }),
        ...(userInfo?.uid && { directoryId: userInfo?.uid }),
      };

      submit(submitParams);
      submitAnalytical({ uid: chatUid, question });
    } catch (error) {
      console.error(`Error in ${type} submission:`, error);
    }
  };

  const onHuskyInput = (query: string) => handleChatSubmission({ question: query, type: 'user-input' });

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = () => {
    onHuskyInput(input);
    setInput('');
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const onCloseFeedback = () => {
    setFeedbackQandA({ question: '', answer: '' });
    feedbackPopupRef.current?.close();
  };

  const onRegenerate = async (query: string) => {
    if (isLoadingObject) {
      return;
    }
    await onHuskyInput(query);
  };

  const onQuestionEdit = (question: string) => {
    setInput(question);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const onCopyAnswer = (answer: string) => {
    console.log('answer', answer);
    return Promise.resolve();
  };

  const getChatCount = (): number => {
    return parseInt(Cookies.get(COOKIE_NAME) || '0', 10);
  };

  const checkChatLimit = (userInfo: any): boolean => {
    const refreshToken = getParsedValue(Cookies.get('refreshToken'));
    if (refreshToken) return true;
    return false;
  };

  const updateChatCount = (): number => {
    if (DAILY_CHAT_LIMIT < getChatCount()) {
      return getChatCount();
    }
    const currentCount = getChatCount() + 1;
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    Cookies.set(COOKIE_NAME, currentCount.toString(), { expires: midnight });
    return currentCount;
  };

  const updateLimitType = () => {
    if (DAILY_CHAT_LIMIT + 1 <= getChatCount()) {
      return 'warn';
    } else if (DAILY_CHAT_LIMIT === getChatCount()) {
      return 'finalRequest';
    } else if (DAILY_CHAT_LIMIT - getChatCount() < 4) {
      return 'info';
    }
    return null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmedValue = textareaRef.current?.value.trim();
      if (!trimmedValue) {
        return;
      }
      submitForm();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    const input = localStorage.getItem('input');
    if (input) {
      handleChatSubmission({ question: input, type: 'user-input' });
      localStorage.removeItem('input');
    }
  }, []);

  useEffect(() => {
    if (isAnswerLoading && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isAnswerLoading]);

  return (
    <>
      {messages.length === 0 && (
        <div className="chat__home">
          <ChatHome onSubmit={onHuskyInput} />
        </div>
      )}

      {messages.length > 0 && (
        <div className="chat" ref={chatContainerRef}>
          <div className="chat__messages-wrapper">
            <Messages
              messages={messages}
              setMessages={setMessages}
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
              {limitReached && limitReached !== 'close' && <HuskyLimitStrip mode="chat" count={DAILY_CHAT_LIMIT - getChatCount()} type={limitReached} from="husky-chat" />}
              <TextArea
                ref={textareaRef}
                placeholder="Go ahead, ask anything!"
                value={input}
                onChange={handleInput}
                rows={2}
                autoFocus
                onKeyDown={handleKeyDown}
                onTextSubmit={submitForm}
                onStopStreaming={stop}
                isAnswerLoading={isAnswerLoading}
                isLoadingObject={isLoadingObject}
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
          width: 989px;
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          z-index: 1;
        }

        .chat__form {
          padding: 20px;
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
          padding-top: 10vh;
        }
      `}</style>
    </>
  );
};

export default Chat;
