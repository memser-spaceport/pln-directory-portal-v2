// This component represents an empty chat interface for the Husky chatbot,
// allowing users to submit prompts and view suggestions.

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { getChatQuestions } from '@/services/discovery.service';
import { PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface HuskyEmptyChatProps {
  limitReached: any;
  setLimitReached: any;
  checkIsLimitReached: any;
}

function HuskyEmptyChat({ limitReached, setLimitReached, checkIsLimitReached }: HuskyEmptyChatProps) {
  // Initial prompts displayed to the user
  const [initialPrompts, setInitialPrompts] = useState<any[]>([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const analytics = useAuthAnalytics();
  const router = useRouter();

  // Function to check if the user is on a mobile device
  const isMobileDevice = () => {
    return /Mobi|Android/i.test(navigator.userAgent);
  };

  const { trackExplorationPromptSelection } = useHuskyAnalytics();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handles the submission of the prompt
  const handlePromptSubmission = async () => {
    const trimmedValue = textareaRef.current?.value.trim();
    if (!trimmedValue) {
      return;
    }
    setLimitReached(checkIsLimitReached());
    if (!checkIsLimitReached()) {
      document.dispatchEvent(new CustomEvent('open-husky-dialog', { detail: { from: 'home', searchText: trimmedValue } }));
    }

    if (textareaRef.current && !checkIsLimitReached()) {
      textareaRef.current.value = ''; // Clear the textarea
    }
  };

  // Handles the click event for exploration prompts
  const onExplorationPromptClicked = async (quesObj: any) => {
    trackExplorationPromptSelection(quesObj.question);
    const links = quesObj?.answerSourceLinks?.map((item:any) => item?.link);
    document.dispatchEvent(new CustomEvent('open-husky-dialog', { detail: { initialChat: {...quesObj, answerSourceLinks: links } } }));
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

  const handleFocus = () => {
    setLimitReached(checkIsLimitReached());
    setIsDropdownOpen(true);
  };

  const handleBlur = (e: any) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDropdownOpen(false);
    }
  };

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  const onLoginClickHandler = () => {
    analytics.onLoginBtnClicked();
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
    getChatQuestions().then((res) => {
      setInitialPrompts(res.data);
    });
  }, []);

  return (
    <>
      <div ref={inputContainerRef} className={`hec__content__input ${limitReached ? 'remove-box-shadow' : ''}`}>
        <div className={`hec__content__box ${limitReached ? 'reset' : ''}`}>
          <div className="hec__content__box__search__icon">🧠</div>
          <TextareaAutosize
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              padding: '6px 6px 6px 40px',
              borderRadius: ' 8px',
              margin: '0px 42px 0px 0px',
              resize: 'none',
            }}
            ref={textareaRef}
            className="hec__content__box__search__input"
            placeholder="Go ahead, ask anything!"
            onKeyDown={handleKeyDown}
            data-testid="prompt-input" // Added data-testid for testing
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {!isMobileDevice() && (
            <div className="hec__content__box__search__instruction">
              <p>
                <span className="hec__content__box__search__instruction__tag">Shift</span> + <span className="hec__content__box__search__instruction__tag">Enter</span> to add new line
              </p>
            </div>
          )}
          <button
            tabIndex={-1} // Allow focusing
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePromptSubmission}
            className={`hec__content__box__search__button ${limitReached ? 'disabled' : ''}`}
            data-testid="submit-button"
            disabled={limitReached}
          >
            <img alt="Send" src="/icons/send.svg" />
          </button>
        </div>
        {isDropdownOpen && (
          <div
            className={`hec__content__box__prompts ${limitReached ? 'err' : ''}`}
            tabIndex={-1} // Allow focusing
            onMouseDown={(e) => e.preventDefault()}
          >
            {limitReached ? (
              <div className="error__strip">
                <div className="error__strip__msgWrpr">
                  <div className="error__strip__warnMsg">
                    <img height={18} width={18} src="/icons/info-red.svg" alt="info" />
                    <span className="warn">Limit reached</span>
                    <span className="seperator">|</span>
                  </div>
                  <div className="error__strip__msg">
                    <span onClick={onLoginClickHandler} className="link">
                      Log in
                    </span>
                    {` `}or{` `}
                    <span onClick={handleSignUpClick} role="link" className="link">
                      Sign up{` `}
                    </span>
                    to get unlimited responses
                  </div>
                </div>
                <div></div>
              </div>
            ) : (
              <>
                <h4 className="hec__content__box__prompts__title">
                  <img alt="Suggestions Orange" src="/icons/suggestions-orange.svg" className="hec__content__box__prompts__title__icon" />
                  <span className="hec__content__box__prompts__title__text">Try asking or searching for</span>
                </h4>
                <div className="hec__content__box__prompts__list">
                  {initialPrompts?.slice(0, 3)?.map((prompt, index) => (
                    <div
                      className="hec__content__box__prompts__list__item"
                      key={index}
                      onClick={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onExplorationPromptClicked(prompt);
                      }}
                      data-testid={`prompt-${index}`}
                    >
                      {/* Added data-testid for each prompt */}
                      <img alt="Prompt Icon" src={prompt.icon} className="hec__content__box__prompts__list__item__icon" />
                      <span className="hec__content__box__prompts__list__item__text">{prompt.question}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .error__strip__msgWrpr {
          display: flex;
          flex-direction: column;
        }
        .error__strip__warnMsg {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .warn {
          color: #dd2c5a;
          font-weight: 600;
          font-size: 12px;
          line-height: 20px;
        }
        .link {
          color: #156ff7;
          cursor: pointer;
          font-size: 12px;
          line-height: 20px;
        }
        .error__strip__msg {
          font-size: 12px;
          line-height: 20px;
        }
        .hec__content__box {
          display: flex;
          background-color: #fff;
          z-index: 2;
          width: 325px;
          position: relative;
          min-height: 40px;
        }
        .hec__content__box__search {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 4px 4px 4px 10px;
          gap: 8px;
          position: relative;
          min-height: 40px;
        }

        .hec__content__input {
          position: absolute;
          display: flex;
          flex-direction: column;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
          z-index: 1;
        }
        .hec__content__box__search__icon {
          position: absolute;
          left: 10px;
          transform: translateY(-50%);
          top: 48%;
          width: 16px;
        }
        .hec__content__box__search__button {
          position: absolute;
          right: 4px;
          transform: translateY(-50%);
          top: 50%;
          width: 31px;
          height: 31px;
          background: #156ff7;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          padding-right: 2px;
        }
        .hec__content__box__prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 12px 16px 12px;
          background: white;
          width: 308px;
          box-shadow: 0px 5px 6px 0px #00000024;
          border-radius: 0 0 8px 8px;
        }
        .err {
          background-color: #f2e0e5;
          border: 1px solid #ff7777;
          border-top: 0px;
          padding: 12px;
        }
        .hec__content__box__prompts__title {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 13px;
          font-weight: 400;
          color: #0f172a;
        }
        .hec__content__box__prompts__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hec__content__box__prompts__list__item {
          display: flex;
          gap: 8px;
          align-items: center;
          cursor: pointer;
          color: #156ff7;
          font-size: 13px;
          font-weight: 400;
        }
        .hec__content__box__search__instruction {
          display: none;
        }
        .hec__content__box__search__instruction__tag {
          border: 1px solid #cbd5e1;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .reset {
          border-radius: 8px !important;
          border: 1px solid #156ff7 !important;
        }
        .disabled {
          background: #94a3b8;
        }
        .seperator {
          display: none;
        }
        @media (min-width: 1024px) {
          .error__strip__msgWrpr {
            flex-direction: row;
            gap: 4px;
          }
          .hec__content__input {
            top: 165px;
            border-radius: 8px;
          }
          .hec__content__box__search__button {
            right: 12px;
            height: 40px;
            width: 40px;
          }
          .hec__content__box__prompts {
            width: 600px;
            border-top: 1px solid #e2e8f0;
          }
          .err {
            width: 90%;
          }
          .remove-box-shadow {
            box-shadow: unset !important;
          }
          .hec__content__box {
            width: 600px;
            box-shadow: unset;
          }
          .hec__content__box__search__input {
            font-size: 16px;
            padding: 10px 0;
          }
          .hec__content__box__search__instruction {
            position: absolute;
            top: 0px;
            right: 68px;
            width: auto;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #adadad;
          }
          .error__strip__msg {
            font-size: 14px;
            line-height: 20px;
          }
          .warn {
            font-size: 14px;
            line-height: 20px;
          }
          .link {
            font-size: 14px;
            line-height: 20px;
          }
          .seperator {
            display: block;
            color: #adadad;
          }
        }
      `}</style>
    </>
  );
}

export default HuskyEmptyChat;
