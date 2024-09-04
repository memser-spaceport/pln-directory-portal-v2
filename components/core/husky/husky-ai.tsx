'use client';
import { useEffect, useRef, useState } from 'react';
import HuskyInputBox from './husky-input-box';
import HuskyAsk from './husky-ask';
import HuskyChat from './husy-chat';
import RoundedTabs from '@/components/ui/rounded-tabs';
import { getHuskyReponse, incrementHuskyShareCount, saveFeedback } from '@/services/husky.service';
import PageLoader from '../page-loader';
import { PopoverDp } from '../popover-dp';
import HuskyAnswerLoader from './husky-answer-loader';
import { useRouter } from 'next/navigation';
import { EVENTS } from '@/utils/constants';
import HuskyFeedback from './husky-feedback';
import { getUniqueId } from '@/utils/common.utils';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import HuskyLogin from './husky-login';
import HuskyLoginExpired from './husky-login-expired';

interface HuskyAiProps {
  mode?: 'blog' | 'chat';
  initialChats?: any[];
  isLoggedIn: boolean;
  blogId?: string;
  onClose?: () => void;
}

function HuskyAi({ mode = 'chat', initialChats = [], isLoggedIn, blogId, onClose }: HuskyAiProps) {
  console.log(blogId)
  const [tab, setTab] = useState('What can I ask?');
  const [chats, setChats] = useState<any[]>(initialChats);
  const [isLoading, setLoadingStatus] = useState(false);
  const [isLoginExpired, setLoginExpiryStatus] = useState(false);
  const [isAnswerLoading, setAnswerLoadingStatus] = useState(false);
  const [feedbackQandA, setFeedbackQandA] = useState({question: '', answer: ''});
  const [askingQuestion, setAskingQuestion] = useState('');
  const [showLoginBox, setLoginBoxStatus] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState('none');
  const chatCnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onTabSelected = (item: string) => {
    setTab(item);
  };

  const forceUserLogin = () => {
    setLoginExpiryStatus(true);
  }

  const getUserCredentials = async () => {
    if(!isLoggedIn) {
      setLoginBoxStatus(true);
      return {
        authToken: null,
        userInfo: null
      };
    }

    const { isLoginRequired, newAuthToken, newUserInfo } = await getUserCredentialsInfo();
    if(isLoginRequired) {
      setLoginExpiryStatus(true);
      return {
        authToken: null,
        userInfo: null
      }
    }

    return {
      authToken: newAuthToken,
      userInfo: newUserInfo
    };
  } 

  const checkAndSetPromptId = () => {
    let chatUid = threadId;
    if (!threadId) {
      chatUid = `${getUniqueId()}`;
      setThreadId(chatUid);
    }
    return chatUid;
  }

  const onPromptClicked = async (question: string) => {
    const {authToken} = await getUserCredentials();
    if(!authToken) {
      return;
    }
    const chatUid = checkAndSetPromptId();
    setAskingQuestion(question);
    setAnswerLoadingStatus(true);
    setTab('Exploration');
    const result = await getHuskyReponse(authToken, question, selectedSource, chatUid, null, null,  mode === 'blog');
    setAskingQuestion('');
    setAnswerLoadingStatus(false);
    setChats([result.data]);
  };

  const onShareClicked = async () => {
    if (blogId) {
      await incrementHuskyShareCount(blogId);
    }
  };

  const onLoginBoxClose = () => {
    setLoginBoxStatus(false);
  };

  const onSourceSelected = (value: string) => {
    setSelectedSource(value);
  };

  const onFollowupClicked = async (question: string) => {
    const {authToken} = await getUserCredentials();
    if(!authToken) {
      return;
    }
    if (!isLoggedIn) {
      setLoginBoxStatus(true);
      return;
    }
    const chatUid = checkAndSetPromptId();
    setAskingQuestion(question);
    setAnswerLoadingStatus(true);

    let result: any;
    if (mode === 'blog' && chats.length === 1) {
      result = await getHuskyReponse(authToken, question, selectedSource, chatUid, chats[0].question, chats[0].answer,  mode === 'blog');
    } else {
      result = await getHuskyReponse(authToken, question, selectedSource, chatUid, null, null,  mode === 'blog');
    }
    setAskingQuestion('');
    setAnswerLoadingStatus(false);
    setChats((v) => [...v, result.data]);
  };

  const onQuestionEdit = (question: string) => {
    document.dispatchEvent(new CustomEvent('husky-ai-input', { detail: question }));
  };

  const onFeedback = async (question: string, answer: string) => {

    setFeedbackQandA({question: question, answer: answer})
  };

  const onHuskyInput = async (query: string) => {
    const {authToken} = await getUserCredentials();
    if(!authToken) {
      return;
    }
    const chatUid = checkAndSetPromptId();

    if (!isLoggedIn) {
      setLoginBoxStatus(true);
      return;
    }
    if (tab === 'What can I ask?') {
      setChats([]);
      setTab('Exploration');
    }
    setAskingQuestion(query);
    setAnswerLoadingStatus(true);
    const result = await getHuskyReponse(authToken, query, selectedSource, chatUid);
    setAskingQuestion('');
    setAnswerLoadingStatus(false);
    setChats((v) => [...v, result.data]);
  };

  const onLoginClick = () => {
    onClose && onClose();
    setLoginBoxStatus(false);
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };


  const onCloseFeedback = () => {
    setFeedbackQandA({question: '', answer: ''})
  };

  useEffect(() => {
    if (isAnswerLoading) {
      const loader = document.getElementById('answer-loader');
      loader?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isAnswerLoading]);

  return (
    <>
      {mode === 'chat' && (
        <div className="huskyai">
          <div className="huskyai__tab">
            <RoundedTabs items={['What can I ask?', 'Exploration']} activeItem={tab} onTabSelected={onTabSelected} />
          </div>
          <div className={`${tab === 'What can I ask?' ? 'huskyai__selection' : 'huskyai__selection--hidden'}`}>
            <HuskyAsk onPromptClicked={onPromptClicked} />
          </div>
          <div ref={chatCnRef} className={`${tab === 'Exploration' ? 'huskyai__selection' : 'huskyai__selection--hidden'}`}>
            <HuskyChat
              onFeedback={onFeedback}
              onRegenerate={onHuskyInput}
              onQuestionEdit={onQuestionEdit}
              onPromptClicked={onPromptClicked}
              isAnswerLoading={isAnswerLoading}
              chats={chats}
              blogId={blogId}
              onFollowupClicked={onFollowupClicked}
              mode="chat"
            />
            {isAnswerLoading && <HuskyAnswerLoader question={askingQuestion} />}
          </div>
          <div className="huskyai__input">
            <HuskyInputBox isAnswerLoading={isAnswerLoading} selectedSource={selectedSource} onSourceSelected={onSourceSelected} onHuskyInput={onHuskyInput} />
          </div>
        </div>
      )}

      {mode === 'blog' && (
        <div className="huskyai">
          <div ref={chatCnRef} className="huskyai__cn">
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
            />
            {isAnswerLoading && <HuskyAnswerLoader question={askingQuestion} />}
          </div>
        </div>
      )}

      {(feedbackQandA.answer && feedbackQandA.question)  && (
        <div className="login-popup">
          <HuskyFeedback forceUserLogin={forceUserLogin} setLoadingStatus={setLoadingStatus} question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
        </div>
      )}

      {isLoading && <PageLoader />}
      {isLoginExpired && <HuskyLoginExpired onLoginClick={onLoginClick}/>}
      {showLoginBox && <HuskyLogin onLoginClick={onLoginClick} onLoginBoxClose={onLoginBoxClose}/>}

      <style jsx>
        {`
         
          .huskyai {
            width: 100%;
            height: 100%;
            position: relative;
            background: white;
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
            border-bottom: 1px solid #cbd5e1;
            background: white;
            z-index: 1;
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
