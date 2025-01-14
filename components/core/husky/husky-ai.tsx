'use client';
import { useEffect, useRef, useState } from 'react';
import HuskyInputBox from './husky-input-box';

import HuskyChat from './husky-chat';
import PageLoader from '../page-loader';
import HuskyAnswerLoader from './husky-answer-loader';
import HuskyFeedback from './husky-feedback';
import { getParsedValue, getUniqueId } from '@/utils/common.utils';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { incrementHuskyShareCount } from '@/services/discovery.service';
import HuskyAsk from './husky-ask';
import { z } from 'zod';
import { experimental_useObject } from 'ai/react';
import Cookies from 'js-cookie';
import HuskyLimitStrip from './husky-limit-strip';
import { AnyNaptrRecord } from 'dns';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';

interface HuskyAiProps {
  mode?: 'blog' | 'chat';
  initialChats?: Chat[];
  isLoggedIn: boolean;
  blogId?: string;
  onClose?: () => void;
  huskySource?: string;
  searchText?: string;
}

interface Chat {
  question: string;
  answer: string;
  isError: boolean;
}

// This component represents the Husky AI interface, allowing users to interact with the AI in chat or blog modes.

function HuskyAi({ mode = 'chat', initialChats = [], isLoggedIn, blogId, onClose, searchText, huskySource }: HuskyAiProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats); // list of chats
  const [isLoading, setLoadingStatus] = useState<boolean>(false); // feedback loading
  const [isAnswerLoading, setAnswerLoadingStatus] = useState<boolean>(false);
  const [feedbackQandA, setFeedbackQandA] = useState({ question: '', answer: '' }); // husky chat loading
  const [threadId, setThreadId] = useState<string>(''); // thread ID
  const [selectedSource, setSelectedSource] = useState<string>('none'); //currently selected source
  const chatCnRef = useRef<HTMLDivElement>(null);
  // track analytics
  const { trackTabSelection, trackUserPrompt, trackAnswerCopy, trackFollowupQuestionClick, trackQuestionEdit, trackRegenerate, trackCopyUrl, trackFeedbackClick, trackAiResponse } =
    useHuskyAnalytics();
  const initialRunRef = useRef(false); // ref for prevent api call second time
  const [limitReached, setLimitReached] = useState<'warn' | 'info' | 'finalRequest' | 'close'>(); // daily limit
  const COOKIE_NAME = 'dailyChats';

  // Forces the user to log in by displaying the login box
  const forceUserLogin = () => {
    onCloseFeedback();
  };

  // Copies the provided answer to the clipboard
  const onCopyAnswer = async (answer: string) => {
    trackAnswerCopy(answer);
  };

  // Fetches user credentials and handles login state
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

  //hook from ai adk
  const {
    object,
    isLoading: isLoadingObject,
    submit,
    error,
  } = experimental_useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/assistant`,
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
    onFinish: (data) => {
      const userInfo = getParsedValue(Cookies.get('userInfo'));

      setAnswerLoadingStatus(false);
    },
    onError: (error) => {
      console.error(error);
      setAnswerLoadingStatus(false);
    },
  });

  // Checks and sets the prompt ID for the current chat session
  const checkAndSetPromptId = () => {
    let chatUid = threadId;
    if (!threadId) {
      chatUid = getUniqueId();
      setThreadId(chatUid);
    }
    return chatUid;
  };

  const getChatCount = (): number => {
    return parseInt(Cookies.get(COOKIE_NAME) || '0', 10);
  };

  const checkChatLimit = (userInfo: any): boolean => {
    if (userInfo?.uid) return true;
    return false;
  };

  const updateChatCount = (): number => {
    const currentCount = getChatCount() + 1;
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    Cookies.set(COOKIE_NAME, currentCount.toString(), { expires: midnight });
    return currentCount;
  };

  const updateLimitType = () => {
    if (DAILY_CHAT_LIMIT === getChatCount()) {
      return 'warn';
    } else if (DAILY_CHAT_LIMIT - getChatCount() === 1) {
      return 'finalRequest';
    } else if (DAILY_CHAT_LIMIT - getChatCount() > 1) {
      return 'info';
    }
    return null;
  };

  // Handles the event when the share button is clicked
  const onShareClicked = async () => {
    if (blogId) {
      trackCopyUrl(blogId);
      await incrementHuskyShareCount(blogId);
    }
  };

  // Handles the selection of a source for the chat
  const onSourceSelected = (value: string) => {
    setSelectedSource(value);
  };

  // Utility function to handle common chat submission logic
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
        const countResponse = updateLimitType();
        if (countResponse === 'warn') {
          setLimitReached('warn');
          return;
        }

        if (countResponse) {
          setLimitReached(countResponse);
        }
      }

      if (!checkChatLimit(userInfo)) {
        updateChatCount();
      }

      const chatUid = checkAndSetPromptId();
      setAnswerLoadingStatus(true);

      // Update chat state
      setChats((prev: any) => [
        ...prev,
        {
          question,
          answer: '',
          followupQuestions: [],
          sources: [],
          actions: [],
        },
      ]);

      // Track analytics
      trackAiResponse('initiated', type, mode === 'blog', question);
      if (type === 'user-input') {
        trackUserPrompt(question);
      } else if (type === 'followup') {
        trackFollowupQuestionClick(mode, question, blogId);
      }

      // Prepare submission parameters
      const submitParams: any = {
        uid: chatUid,
        question,
        source: selectedSource,
        ...(userInfo?.name && { name: userInfo?.name }),
        ...(userInfo?.email && { email: userInfo?.email }),
        ...(userInfo?.uid && { directoryId: userInfo?.uid }),
      };

      // Add chat summary for blog mode followup questions
      if (mode === 'blog' && previousContext) {
        submitParams.chatSummary = {
          user: previousContext.question,
          system: previousContext.answer,
        };
      }

      await submit(submitParams);
      setAnswerLoadingStatus(false);
      trackAiResponse('success', type, mode === 'blog', question);
    } catch (error) {
      trackAiResponse('error', type, mode === 'blog', question);
      console.error(`Error in ${type} submission:`, error);
    }
  };

  // Handles the event when a prompt is clicked
  const onPromptClicked = (question: string) => handleChatSubmission({ question, type: 'prompt' });

  // Handles follow-up questions are clicked
  const onFollowupClicked = (question: string) => {
    const previousContext = chats.length === 1 ? { question: chats[0].question, answer: chats[0].answer } : null;

    return handleChatSubmission({
      question,
      type: 'followup',
      previousContext,
    });
  };

  // Handles user input and fetches the AI response
  const onHuskyInput = (query: string) => handleChatSubmission({ question: query, type: 'user-input' });

  // Edits the question and tracks the event
  const onQuestionEdit = (question: string) => {
    trackQuestionEdit(question);
    document.dispatchEvent(new CustomEvent('husky-ai-input', { detail: question }));
  };

  // Handles feedback submission
  const onFeedback = async (question: string, answer: string) => {
    trackFeedbackClick(question, answer);
    setFeedbackQandA({ question, answer });
  };

  // Regenerates the response based on the query
  const onRegenerate = async (query: string) => {
    if (isLoadingObject) {
      return;
    }
    trackRegenerate();
    await onHuskyInput(query);
  };

  useEffect(() => {
    if (error) {
      setChats((prev: any) => {
        const newMessages = [...prev];

        // Update the last item in the array
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: '',
          isError: true,
        };
        return newMessages;
      });
    }

    if (object?.content && isLoadingObject) {
      setAnswerLoadingStatus(false);
      setChats((prev: any) => {
        if (prev.length === 0) {
          return [
            {
              answer: object?.content || '',
              followupQuestions: object?.followUpQuestions || [],
              answerSourceLinks: object?.sources || [],
              actions: object?.actions || [],
            },
          ];
        }

        // Create a shallow copy of the chats array
        const newMessages = [...prev];

        // Update the last item in the array
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: object?.content || newMessages[lastIndex]?.answer || '',
          followupQuestions: object?.followUpQuestions || newMessages[lastIndex]?.followupQuestions || [],
          answerSourceLinks: object?.sources || newMessages[lastIndex]?.answerSourceLinks || [],
          actions: object?.actions || newMessages[lastIndex]?.actions || [],
        };

        return newMessages;
      });
    }
  }, [object, isLoadingObject, error]);

  // Closes the feedback popup
  const onCloseFeedback = () => {
    setFeedbackQandA({ question: '', answer: '' });
  };

  // Scrolls to the answer loader when loading
  useEffect(() => {
    if (isAnswerLoading) {
      const loader = document.getElementById('answer-loader');
      loader?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAnswerLoading]);

  useEffect(() => {
    if (!initialRunRef.current && huskySource === 'home' && searchText) {
      onPromptClicked(searchText);
      initialRunRef.current = true;
    }
  }, [huskySource, searchText]);

  return (
    <>
      {mode === 'chat' && (
        <div className="huskyai" data-testid="husky-ai-chat">
          <div className="huskyai__selection--hidden" data-testid="supported-scope">
            <HuskyAsk onPromptClicked={onPromptClicked} />
          </div>
          <div ref={chatCnRef} className="huskyai__selection" data-testid="chat-container">
            <HuskyChat
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onQuestionEdit={onQuestionEdit}
              onPromptClicked={onPromptClicked}
              isAnswerLoading={isAnswerLoading}
              chats={chats}
              blogId={blogId}
              onFollowupClicked={onFollowupClicked}
              mode="chat"
              onCopyAnswer={onCopyAnswer}
              isLoadingObject={isLoadingObject}
            />
            {isAnswerLoading && <HuskyAnswerLoader data-testid="chat-answer-loader" />}
          </div>

          <div className="huskyai__footer">
            <div className="huskyai__footer__strip">
              {limitReached && limitReached !== 'close' && (
                <HuskyLimitStrip mode="chat" count={DAILY_CHAT_LIMIT - getChatCount()} onDialogClose={onClose} type={limitReached} onClose={() => setLimitReached('close')} />
              )}
            </div>
            {chats.length !== 0 && (
              <div className="huskyai__input" data-testid="input-box">
                <HuskyInputBox isLoadingObject={isLoadingObject} isAnswerLoading={isAnswerLoading} selectedSource={selectedSource} onSourceSelected={onSourceSelected} onHuskyInput={onHuskyInput} />
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'blog' && (
        <div className="huskyai" data-testid="husky-ai-blog">
          <div ref={chatCnRef} className="huskyai__cn" data-testid="blog-chat-container">
            <HuskyChat
              onFeedback={onFeedback}
              onRegenerate={onHuskyInput}
              onQuestionEdit={onQuestionEdit}
              onPromptClicked={onPromptClicked}
              onShareClicked={onShareClicked}
              isAnswerLoading={isAnswerLoading}
              chats={chats}
              blogId={blogId}
              onFollowupClicked={onFollowupClicked}
              mode="blog"
              onCopyAnswer={onCopyAnswer}
              isLoadingObject={isLoadingObject}
            />
            {isAnswerLoading && <HuskyAnswerLoader data-testid="blog-answer-loader" />}
            {limitReached && limitReached !== 'close' && (
              <div className="huskyai__cn__strip">
                <HuskyLimitStrip mode="blog" count={DAILY_CHAT_LIMIT - getChatCount()} type={limitReached} onClose={() => setLimitReached('close')} onDialogClose={onClose} />
              </div>
            )}
          </div>
        </div>
      )}

      {feedbackQandA.answer && feedbackQandA.question && (
        <div className="feedback-popup" data-testid="feedback-popup">
          <HuskyFeedback forceUserLogin={forceUserLogin} setLoadingStatus={setLoadingStatus} question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
        </div>
      )}
      
      {isLoading && <PageLoader data-testid="page-loader" />}

      <style jsx>
        {`
          .huskyai {
            width: 100%;
            height: 100%;
            position: relative;
            background: white;
          }
          .feedback-popup {
            width: 100%;
            height: 100%;
            position: absolute;
            background: #b0bde099;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3;
          }
          .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            width: 100%;
            z-index: 10;
          }
          .huskyai__tab {
            position: absolute;
            width: 100%;
            background: white;
            z-index: 3;
            top: -1px;
            left: 0;
            right: 0;
          }
          .huskyai__selection {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            position: relative;
            padding-bottom: ${limitReached !== 'close' ? '135px' : '64px'};
            display: block;
            background: #f4faff;
          }
          .huskyai__selection--hidden {
            display: none;
          }
          .huskyai__cn {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            position: relative;
          }
          .huskyai__footer {
            width: 100%;
            height: fit-content;
            z-index: 1;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }
          .huskyai__input {
            width: 100%;
            height: fit-content;
            max-height: 100px;
            background: white;
            border-top: 0.5px solid #cbd5e1;
          }
          .huskyai__cn__strip {
            position: sticky;
            bottom: 0;
            padding: 0px 0px 20px 0px;
            margin: 0px 16px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffffff 54.22%);
          }
          .huskyai__footer__strip {
            margin: 0px 16px;
          }

          @media (min-width: 1024px) {
            .huskyai__selection {
              padding-bottom: ${limitReached !== 'close' ? '100px' : '64px'};
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAi;