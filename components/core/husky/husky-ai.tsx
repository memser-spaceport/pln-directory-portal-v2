'use client';
import { useEffect, useRef, useState } from 'react';
import HuskyInputBox from './husky-input-box';

import HuskyChat from './husky-chat'; 
import BookmarkTabs from '@/components/ui/bookmark-tabs';
import PageLoader from '../page-loader';
import HuskyAnswerLoader from './husky-answer-loader';
import { useRouter } from 'next/navigation';
import HuskyFeedback from './husky-feedback';
import { getUniqueId } from '@/utils/common.utils';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import HuskyLogin from './husky-login';
import HuskyLoginExpired from './husky-login-expired';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { createLogoutChannel } from '../login/broadcast-channel';
import { incrementHuskyShareCount } from '@/services/home.service';
import { getHuskyResponse } from '@/services/husky.service';
import HuskyAsk from './husky-ask';

interface HuskyAiProps {
  mode?: 'blog' | 'chat';
  initialChats?: Chat[];
  isLoggedIn: boolean;
  blogId?: string;
  onClose?: () => void;
}

interface Chat {
  question: string;
  answer: string;
  isError: boolean;
}

const DEFAULT_TAB_ITEMS = [
  { key: 'home', displayText: 'Home' },
  { key: 'supported-scope', displayText: 'Supported Scope' }
];

// This component represents the Husky AI interface, allowing users to interact with the AI in chat or blog modes.

function HuskyAi({ mode = 'chat', initialChats = [], isLoggedIn, blogId, onClose }: HuskyAiProps) {
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB_ITEMS[0].key);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [isLoading, setLoadingStatus] = useState<boolean>(false);
  const [isLoginExpired, setLoginExpiryStatus] = useState<boolean>(false);
  const [isAnswerLoading, setAnswerLoadingStatus] = useState<boolean>(false);
  const [feedbackQandA, setFeedbackQandA] = useState<{ question: string; answer: string }>({ question: '', answer: '' });
  const [askingQuestion, setAskingQuestion] = useState<string>('');
  const [showLoginBox, setLoginBoxStatus] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('none');
  const chatCnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { trackTabSelection, trackUserPrompt, trackAnswerCopy, trackFollowupQuestionClick, trackQuestionEdit, trackRegenerate, trackCopyUrl, trackFeedbackClick, trackAiResponse } = useHuskyAnalytics();

  // Handles the selection of a tab in the UI
  const onTabSelected = (item: string) => {
    setActiveTab(item);
    trackTabSelection(item);
  };

  // Forces the user to log in by displaying the login box
  const forceUserLogin = () => {
    onCloseFeedback();
    setLoginExpiryStatus(true);
  };

  // Handles the login process when the user clicks the login button
  const onForceLogin = () => {
    onClose && onClose();
    setLoginBoxStatus(false);
    createLogoutChannel().postMessage('logout');
  };

  // Copies the provided answer to the clipboard
  const onCopyAnswer = async (answer: string) => {
    trackAnswerCopy(answer);
  };

  // Fetches user credentials and handles login state
  const getUserCredentials = async () => {
    if (!isLoggedIn) {
      setLoginBoxStatus(true);
      return {
        authToken: null,
        userInfo: null,
      };
    }

    const { isLoginRequired, newAuthToken, newUserInfo } = await getUserCredentialsInfo();
    if (isLoginRequired) {
      setLoginExpiryStatus(true);
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
  const checkAndSetPromptId = () => {
    let chatUid = threadId;
    if (!threadId) {
      chatUid = getUniqueId();
      setThreadId(chatUid);
    }
    return chatUid;
  };

  // Handles the event when a prompt is clicked
  const onPromptClicked = async (question: string) => {
    try {
      const { authToken, userInfo } = await getUserCredentials();
      if (!authToken) {
        return;
      }
      const chatUid = checkAndSetPromptId();
      setAskingQuestion(question);
      setAnswerLoadingStatus(true);
      setActiveTab(DEFAULT_TAB_ITEMS[0].key);
      setChats([]);
      trackAiResponse('initiated', 'prompt', mode === 'blog', question);
      const result = await getHuskyResponse(userInfo, authToken, question, selectedSource, chatUid, null, null, mode === 'blog'); // Fixed function name
      setAskingQuestion('');
      setAnswerLoadingStatus(false);
      if (result.isError) {
        trackAiResponse('error', 'prompt', mode === 'blog', question);
        setChats((prevChats) => [...prevChats, { question, answer: '', isError: true }]);
        return;
      }
      trackAiResponse('success', 'prompt', mode === 'blog', question);
      setChats(result.data ? [{ ...result.data, isError: false }] : []);
    } catch (error) {
      trackAiResponse('error', 'prompt', mode === 'blog', question);
    }
  };

  // Handles the event when the share button is clicked
  const onShareClicked = async () => {
    if (blogId) {
      trackCopyUrl(blogId);
      await incrementHuskyShareCount(blogId);
    }
  };

  // Closes the login box
  const onLoginBoxClose = () => {
    setLoginBoxStatus(false);
  };

  // Handles the selection of a source for the chat
  const onSourceSelected = (value: string) => {
    setSelectedSource(value);
  };

  // Handles follow-up questions
  const onFollowupClicked = async (question: string) => {
    try {
      const { authToken, userInfo } = await getUserCredentials();
      if (!authToken) {
        return;
      }
      if (!isLoggedIn) {
        setLoginBoxStatus(true);
        return;
      }
      trackFollowupQuestionClick(mode, question, blogId);
      trackAiResponse('initiated', 'followup', mode === 'blog', question);
      const chatUid = checkAndSetPromptId();
      setAskingQuestion(question);
      setAnswerLoadingStatus(true);

      const result = await getHuskyResponse(userInfo, authToken, question, selectedSource, chatUid, mode === 'blog' && chats.length === 1 ? chats[0].question : null, mode === 'blog' && chats.length === 1 ? chats[0].answer : null, mode === 'blog'); // Fixed function name
      setAskingQuestion('');
      setAnswerLoadingStatus(false);
      if (result.isError) {
        trackAiResponse('error', 'followup', mode === 'blog', question);
        setChats((prevChats) => [...prevChats, { question, answer: '', isError: true }]);
        return;
      }
      trackAiResponse('success', 'followup', mode === 'blog', question);
      setChats((prevChats) => result.data ? [...prevChats, { ...result.data, isError: false }] : prevChats);
    } catch (error) {
      trackAiResponse('error', 'followup', mode === 'blog', question);
    }
  };

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
    const { authToken } = await getUserCredentials();
    if (!authToken) {
      return;
    }
    trackRegenerate();
    await onHuskyInput(query);
  };

  // Handles user input and fetches the AI response
  const onHuskyInput = async (query: string) => {
    try {
      const { authToken, userInfo } = await getUserCredentials();
      if (!authToken) {
        return;
      }
      const chatUid = checkAndSetPromptId();

      if (!isLoggedIn) {
        setLoginBoxStatus(true);
        return;
      }
      if (activeTab === 'supported-scope') { 
        setChats([]);
        setActiveTab(DEFAULT_TAB_ITEMS[0].key);
      }
      trackUserPrompt(query);
      setAskingQuestion(query);
      setAnswerLoadingStatus(true);
      trackAiResponse('initiated', 'user-input', mode === 'blog', query);
      const result = await getHuskyResponse(userInfo, authToken, query, selectedSource, chatUid);
      setAskingQuestion('');
      setAnswerLoadingStatus(false);
      if (result.isError) {
        trackAiResponse('error', 'user-input', mode === 'blog', query);
        setChats((prevChats) => [...prevChats, { question: query, answer: '', isError: true }]);
        return;
      }
      trackAiResponse('success', 'user-input', mode === 'blog', query);
      setChats((prevChats) => result.data ? [...prevChats, { ...result.data, isError: false }] : prevChats);
    } catch (error) {
      trackAiResponse('error', 'user-input', mode === 'blog', query);
    }
  };

  // Handles the login click event
  const onLoginClick = () => {
    onClose && onClose();
    setLoginBoxStatus(false);
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  // Closes the feedback popup
  const onCloseFeedback = () => {
    setFeedbackQandA({ question: '', answer: '' });
  };

  useEffect(() => {
    // Scrolls to the answer loader when loading
    if (isAnswerLoading) {
      const loader = document.getElementById('answer-loader');
      loader?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [isAnswerLoading]);

  return (
    <>
      {mode === 'chat' && (
        <div className="huskyai" data-testid="husky-ai-chat">
          <div className="huskyai__tab">
            <BookmarkTabs tabItems={DEFAULT_TAB_ITEMS} activeTab={activeTab} onTabSelect={onTabSelected} />
          </div>
          <div className={`${activeTab === 'supported-scope' ? 'huskyai__selection' : 'huskyai__selection--hidden'}`} data-testid="supported-scope">
            <HuskyAsk onPromptClicked={onPromptClicked} />
          </div>
          <div ref={chatCnRef} className={`${activeTab === 'home' ? 'huskyai__selection' : 'huskyai__selection--hidden'}`} data-testid="chat-container">
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
            />
            {isAnswerLoading && <HuskyAnswerLoader question={askingQuestion} data-testid="answer-loader" />}
          </div>
          {((activeTab === 'home' && chats.length !== 0) || activeTab === 'supported-scope') && <div className="huskyai__input" data-testid="input-box">
            <HuskyInputBox isAnswerLoading={isAnswerLoading} selectedSource={selectedSource} onSourceSelected={onSourceSelected} onHuskyInput={onHuskyInput} />
          </div> }
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
            />
            {isAnswerLoading && <HuskyAnswerLoader question={askingQuestion} data-testid="blog-answer-loader" />}
          </div>
        </div>
      )}

      {feedbackQandA.answer && feedbackQandA.question && (
        <div className="feedback-popup" data-testid="feedback-popup">
          <HuskyFeedback forceUserLogin={forceUserLogin} setLoadingStatus={setLoadingStatus} question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
        </div>
      )}

      {isLoading && <PageLoader data-testid="page-loader" />}
      {isLoginExpired && <HuskyLoginExpired onLoginClick={onForceLogin} data-testid="login-expired" />}
      {showLoginBox && <HuskyLogin onLoginClick={onLoginClick} onLoginBoxClose={onLoginBoxClose} data-testid="login-box" />}

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
            padding-top: 48px;
            padding-bottom: 112px;
            display: block;
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
          .huskyai__input {
            width: 100%;
            height: fit-content;
            max-height: 100px;
            z-index: 1;
            position: absolute;
            background: white;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #cbd5e1;
          }

          @media (min-width: 1024px) {
          }
        `}
      </style>
    </>
  );
}

export default HuskyAi;
