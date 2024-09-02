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

  const onPromptClicked = async (question: string) => {
     if (!isLoggedIn) {
      setLoginBoxStatus(true);
      return;
    }
    const chatUid = `${getUniqueId()}`;
    setThreadId(chatUid);
    setAskingQuestion(question);
    setAnswerLoadingStatus(true);
    setTab('Exploration');
    const result = await getHuskyReponse(question, selectedSource, chatUid, null, null,  mode === 'blog');
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
    if (!isLoggedIn) {
      setLoginBoxStatus(true);
      return;
    }
    let chatUid = threadId;
    if (!threadId) {
      chatUid = `${getUniqueId()}`;
      setThreadId(chatUid);
    }
    setAskingQuestion(question);
    setAnswerLoadingStatus(true);

    let result: any;
    if (mode === 'blog' && chats.length === 1) {
      result = await getHuskyReponse(question, selectedSource, chatUid, chats[0].question, chats[0].answer,  mode === 'blog');
    } else {
      result = await getHuskyReponse(question, selectedSource, chatUid, null, null,  mode === 'blog');
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
    let chatUid = threadId;
    if (!threadId) {
      chatUid = `${getUniqueId()}`;
      setThreadId(chatUid);
    }

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
    const result = await getHuskyReponse(query, selectedSource, chatUid);
    setAskingQuestion('');
    setAnswerLoadingStatus(false);
    setChats((v) => [...v, result.data]);
  };

  const onLoginClick = () => {
    onClose && onClose();
    setLoginBoxStatus(false);
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  const onJoinNetworkListClick = (item: any) => {
    onClose && onClose();
    setLoginBoxStatus(false);
    if (item === 'member') {
      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_MEMBER_REGISTER_DIALOG));
    } else if (item === 'team') {
      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_TEAM_REGISTER_DIALOG));
    }
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
          <HuskyFeedback setLoadingStatus={setLoadingStatus} question={feedbackQandA.question} answer={feedbackQandA.answer} onClose={onCloseFeedback} />
        </div>
      )}

      {isLoading && <PageLoader />}

      {showLoginBox && (
        <div className="login-popup">
          <div className="login-popup__box">
            <h3 className="login-popup__box__title">Login to continue using Husky</h3>
            <p className="login-popup__box__desc">
              Husky is purpose built to improve your speed & quality of learning about the Protocol Labs innovation network. Login or Join us to become part of this growing network
            </p>
            <div className="login-popup__box__actions">
              <div className="login-popup__box__actions__left">
                <button type="button" onClick={onLoginBoxClose} className="login-popup__box__actions__left__dismiss">
                  Dismiss
                </button>
              </div>
              <div className="login-popup__box__actions__right">
                <PopoverDp.Wrapper>
                  <button className="login-popup__box__actions__right__join">
                    Join the network <img src="/icons/dropdown-white.svg" alt="down arrow" />
                  </button>
                  <PopoverDp.Pane position="top">
                    <div className="login-popup__box__actions__right__join__pane">
                      <button className="login-popup__box__actions__right__join__pane__item" onClick={() => onJoinNetworkListClick('member')}>
                        Join as Member
                      </button>
                      <button className="login-popup__box__actions__right__join__pane__item" onClick={() => onJoinNetworkListClick('team')}>
                        Join as Team
                      </button>
                    </div>
                  </PopoverDp.Pane>
                </PopoverDp.Wrapper>
                <button onClick={onLoginClick} className="login-popup__box__actions__right__login">
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>
        {`
          .login-popup {
            width: 100%;
            height: 100%;
            position: absolute;
            background: #b0bde099;
            top: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }
          .login-popup__box {
            background: white;

            width: 90%;
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .login-popup__box__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
          }
          .login-popup__box__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }
          .login-popup__box__actions {
            display: flex;
            justify-content: space-between;
            flex-direction: column-reverse;
            gap: 8px;
          }
          .login-popup__box__actions__left__dismiss {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            background: white;
            font-size: 14px;
            font-weight: 500;
            width: 100%;
          }
          .login-popup__box__actions__right {
            display: flex;
            gap: 8px;
            flex-direction: column;
          }
          .login-popup__box__actions__right__join {
            border-radius: 8px;
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
          }

          .login-popup__box__actions__right__join__pane {
            width: 100%;
            padding: 5px;
          }

          .login-popup__box__actions__right__join__pane__item {
            padding: 5px 15px;
            font-size: 14px;
            background: transparent;
            width: 100%;
            text-align: left;
          }

          .login-popup__box__actions__right__join__pane__item:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .login-popup__box__actions__right__login {
            border-radius: 8px;
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
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
            .login-popup__box__actions {
              display: flex;
              justify-content: space-between;
              flex-direction: row;
              gap: unset;
            }

            .login-popup__box__actions__left__dismiss {
              width: unset;
            }

            .login-popup__box__actions__right {
              flex-direction: row;
            }

            .login-popup__box__actions__right__join {
              width: unset;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyAi;
