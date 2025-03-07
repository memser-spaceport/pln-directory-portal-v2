import { getChatQuestions } from '@/services/discovery.service';
import { getParsedValue, isMobileDevice } from '@/utils/common.utils';
import { DAILY_CHAT_LIMIT, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import TextArea from './chat-input';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getChatCount } from '@/utils/husky.utlils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

interface ChatHomeProps {
  onSubmit: (query: string) => void;
  setMessages: (messages: any[]) => void;
  setType: (type: string) => void;
}

const ChatHome = ({ onSubmit, setMessages, setType }: ChatHomeProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [initialPrompts, setInitialPrompts] = useState<any[]>([]);
  const [limitReached, setLimitReached] = useState<boolean>(false); // daily limit check
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const analytics = useHuskyAnalytics();

  useEffect(() => {
    getChatQuestions().then((res) => {
      setInitialPrompts(res.data);
    });
  }, []);

  const checkIsLimitReached = () => {
    const refreshToken = getParsedValue(Cookies.get('refreshToken'));
    if (!refreshToken) {
      const chatCount = getChatCount();
      return DAILY_CHAT_LIMIT <= chatCount;
    }
    return false;
  };

  const handleFocus = () => {
    setLimitReached(checkIsLimitReached());
    setIsDropdownOpen(true);
  };

  const handleBlur = (e: any) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDropdownOpen(false);
    }
  };

  // Handles the submission of the prompt
  const handlePromptSubmission = async () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      return;
    }
    setLimitReached(checkIsLimitReached());
    if (!checkIsLimitReached()) {
      analytics.trackHuskyHomeSearch(trimmedValue, 'husky-page');
      onSubmit(trimmedValue);
    }

    if (textareaRef.current && !checkIsLimitReached()) {
      textareaRef.current.value = ''; // Clear the textarea
    }
  };

  // Handles key down events in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<any>) => {
    const isMobileOrTablet = /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent);
    if (!isMobileOrTablet && window.innerWidth >= 1024) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevents adding a new line
        handlePromptSubmission(); // Submits the form
      }
    }
  };

  const handleSignUpClick = () => {
    // analytics.trackSignupFromHuskyChat('home-search');
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  // Handles the click event for exploration prompts
  const onExplorationPromptClicked = async (quesObj: any) => {
    analytics.trackExplorationPromptSelection(quesObj.question, 'husky-page');
    const links = quesObj?.answerSourceLinks?.map((item: any) => item?.link);
    setMessages([{ ...quesObj, sources: links, followUpQuestions: quesObj?.followupQuestions }]);
    setType('blog');
    // document.dispatchEvent(new CustomEvent('open-husky-dialog', { detail: { initialChat: { ...quesObj, answerSourceLinks: links } } }));
  };

  const onLoginClickHandler = () => {
    // analytics.trackSignupFromHuskyChat('home-search');
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };

  useEffect(() => {
    setLimitReached(checkIsLimitReached());
  }, []);

  return (
    <>
      <div className="chat-home">
        <div className="chat-home__header">
          <h3 className="chat-home__title">Explore Protocol Labs with Husky, an LLM-powered chatbot</h3>
        </div>
        <form className="chat-home__form">
          <TextArea
            className="zindex-1"
            placeholder="Go ahead, ask anything!"
            rows={isMobileDevice() ? 1 : 2}
            ref={textareaRef}
            autoFocus
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onTextSubmit={handlePromptSubmission}
            isLimitReached={limitReached}
          />
          {isDropdownOpen && (
            <div className={`chat-home__prompts ${limitReached ? 'chat-home__prompts--error' : ''}`} tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
              {limitReached ? (
                <div className="chat-home__error">
                  <div className="chat-home__error-wrapper">
                    <div className="chat-home__error-warning">
                      <img height={18} width={18} src="/icons/info-orange.svg" alt="info" />
                      <span className="chat-home__error-text">Limit reached</span>
                      <span className="chat-home__error-separator">|</span>
                    </div>
                    <div className="chat-home__error-message">
                      <span onClick={onLoginClickHandler} className="chat-home__link">
                        Log in
                      </span>
                      {` `}or{` `}
                      <span onClick={handleSignUpClick} role="link" className="chat-home__link">
                        Sign up{` `}
                      </span>
                      to get unlimited responses
                    </div>
                  </div>
                  <div></div>
                </div>
              ) : (
                <>
                  <h4 className="chat-home__prompts-title">
                    <img alt="Suggestions Orange" src="/icons/suggestions-orange.svg" className="chat-home__prompts-icon" />
                    <span className="chat-home__prompts-text">Try asking or searching for</span>
                  </h4>
                  <div className="chat-home__prompts-list">
                    {initialPrompts?.slice(0, 3)?.map((prompt, index) => (
                      <div
                        className="chat-home__prompts-item"
                        key={index}
                        onClick={(e: any) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onExplorationPromptClicked(prompt);
                        }}
                        data-testid={`prompt-${index}`}
                      >
                        <img alt="Prompt Icon" src={prompt.icon} className="chat-home__prompts-item-icon" />
                        <span className="chat-home__prompts-item-text">{prompt.question}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </form>
      </div>
      <style jsx>{`
        .chat-home {
          background-image: url('/images/husky/husky-banner.svg');
          background-size: 235px 230px;
          background-repeat: no-repeat;
          background-position: center 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 25px;
          width: 100%;
        }

        .chat-home__header {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 54px;
        }

        .chat-home__form {
          position: relative;
          width: calc(100% - 20px);
          display: flex;
          justify-content: center;
        }

        .chat-home__textarea {
          position: relative;
          z-index: 1;
        }

        .chat-home__title {
          font-weight: 500;
          width: 267px;
          text-align: center;
          color: #1e3a8a;
          font-size: 20px;
          line-height: 26px;
        }

        .chat-home__prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 12px 16px 12px;
          background: white;
          width: 95%;
          box-shadow: 0px 5px 6px 0px #00000024;
          border-radius: 0 0 8px 8px;
          position: absolute;
          top: 100%;
          z-index: 0;
        }

        .chat-home__prompts--error {
          background-color: #ffe8cc;
          border: 1px solid #ff820e;
          border-top: 0px;
          padding: 12px;
        }

        .chat-home__prompts-title {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 13px;
          font-weight: 400;
          color: #0f172a;
        }

        .chat-home__prompts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chat-home__prompts-item {
          display: flex;
          gap: 8px;
          align-items: center;
          cursor: pointer;
          color: #156ff7;
          font-size: 13px;
          font-weight: 400;
        }

        .chat-home__error-wrapper {
          display: flex;
          flex-direction: column;
        }

        .chat-home__error-warning {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .chat-home__error-message {
          font-size: 12px;
          line-height: 20px;
        }

        .chat-home__link {
          color: #156ff7;
          cursor: pointer;
          font-size: 12px;
          line-height: 20px;
        }

        .chat-home__error-text {
          color: #ff820e;
          font-weight: 600;
          font-size: 12px;
          line-height: 20px;
        }

        .chat-home__error-separator {
          display: none;
        }

        @media (min-width: 768px) {
          .chat-home {
            // height: 400px;
            background-size: 387px 341px;
            padding-top: 102px;
            background-position: top center;
          }

          .chat-home__header {
            padding-top: unset;
          }

          .chat-home__title {
            font-size: 28.8px;
            line-height: 34.85px;
            width: 587px;
          }

          .chat-home__form {
            width: 602px;
            background-position: center;
          }

          .chat-home__error-message {
            font-size: 14px;
            line-height: 20px;
          }

          .chat-home__error-wrapper {
            display: flex;
            flex-direction: row;
            gap: 4px;
          }

          .chat-home__link {
            font-size: 14px;
          }

          .chat-home__error-separator {
            display: block;
            color: #adadad;
          }

          .chat-home__error-text {
            font-size: 14px;
          }

          .chat-home__prompts {
            width: 100%;
          }
          
           .chat-home__prompts--error {
            width: 95%;
          }
        }
      `}</style>
    </>
  );
};

export default ChatHome;
