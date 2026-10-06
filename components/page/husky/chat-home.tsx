import { getChatQuestions } from '@/services/discovery.service';
import { getParsedValue } from '@/utils/common.utils';
import { DAILY_CHAT_LIMIT, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { useCurrentUserStore } from '@/services/auth/store';
import ChatComposer from './chat-composer';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';
import { getChatCount } from '@/utils/husky.utlils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useLoginRedirect } from '@/components/core/login/utils';

// LAB-2773: the new-chat page shows this many suggestions under the field at rest.
const VISIBLE_PROMPT_COUNT = 4;
// Copy from the LAB-2702 prototype: one line on what the answers come from.
export const SCOPE_LINE = 'Answers come from the directory: members, teams, projects, events and forum posts.';

interface ChatHomeProps {
  onSubmit: (query: string) => void;
  setMessages: (messages: any[]) => void;
  setType: (type: string) => void;
}

const ChatHome = ({ onSubmit, setMessages, setType }: ChatHomeProps) => {
  const [initialPrompts, setInitialPrompts] = useState<any[]>([]);
  const [limitReached, setLimitReached] = useState<boolean>(false); // daily limit check
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const goToLogin = useLoginRedirect();
  const analytics = useHuskyAnalytics();

  useEffect(() => {
    getChatQuestions()
      .then((res) => {
        setInitialPrompts(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        // Suggestions are optional: on failure the area stays hidden.
        setInitialPrompts([]);
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
  };

  const visiblePrompts = initialPrompts.slice(0, VISIBLE_PROMPT_COUNT);

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
    analytics.trackSignupFromHuskyChat('husky-home-search');
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
    analytics.trackLoginFromHuskyChat('husky-home-search');
    const userInfo = useCurrentUserStore.getState().currentUser;
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      goToLogin();
    }
  };

  useEffect(() => {
    setLimitReached(checkIsLimitReached());
  }, []);

  return (
    <>
      <div className="chat-home">
        <div className="chat-home__header">
          <h3 className="chat-home__title">Explore Protocol Labs with AI</h3>
          <p className="chat-home__scope" data-testid="chat-home-scope">
            {SCOPE_LINE}
          </p>
        </div>
        <form className="chat-home__form" onSubmit={(e) => e.preventDefault()}>
          <ChatComposer
            size="home"
            placeholder="Go ahead, ask anything!"
            rows={1}
            ref={textareaRef}
            autoFocus
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onTextSubmit={handlePromptSubmission}
            isLimitReached={limitReached}
          />
        </form>
        {limitReached ? (
          <div className="chat-home__error" data-testid="chat-home-limit">
            <div className="chat-home__error-wrapper">
              <div className="chat-home__error-warning">
                <img height={18} width={18} src="/icons/info-orange.svg" alt="info" />
                <span className="chat-home__error-text">Limit reached</span>
                <span className="chat-home__error-separator">|</span>
              </div>
              <div className="chat-home__error-message">
                <span onClick={onLoginClickHandler} className="chat-home__link">
                  Sign in
                </span>
                {` `}or{` `}
                <span onClick={handleSignUpClick} role="link" className="chat-home__link">
                  Sign up{` `}
                </span>
                to get unlimited responses
              </div>
            </div>
          </div>
        ) : (
          visiblePrompts.length > 0 && (
            <div className="chat-home__prompts" data-testid="chat-home-prompts">
              <div className="chat-home__prompts-title">Try asking</div>
              <ul className="chat-home__prompts-list">
                {visiblePrompts.map((prompt, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      className="chat-home__prompts-item"
                      onClick={(e) => {
                        e.preventDefault();
                        onExplorationPromptClicked(prompt);
                      }}
                      data-testid={`prompt-${index}`}
                    >
                      {prompt.icon && <img alt="" src={prompt.icon} className="chat-home__prompts-item-icon" />}
                      <span className="chat-home__prompts-item-text">{prompt.question}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
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
          gap: 24px;
          width: 100%;
          padding: 0 16px 32px;
        }

        .chat-home__header {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding-top: 54px;
          text-align: center;
        }

        .chat-home__title {
          font-weight: 500;
          max-width: 267px;
          text-align: center;
          color: #1e3a8a;
          font-size: 20px;
          line-height: 26px;
        }

        .chat-home__scope {
          margin: 0;
          color: var(--foreground-neutral-secondary, #455468);
          font-size: 14px;
          line-height: 20px;
          text-wrap: pretty;
        }

        .chat-home__form {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .chat-home__prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .chat-home__prompts-title {
          color: #156ff7;
          font-size: 12px;
          font-weight: 500;
          line-height: 16px;
        }

        .chat-home__prompts-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .chat-home__prompts-item {
          display: flex;
          gap: 8px;
          align-items: center;
          width: 100%;
          padding: 8px;
          border: 0;
          border-radius: 8px;
          background: #f8fafc;
          color: #475569;
          font: inherit;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          cursor: pointer;
        }

        .chat-home__prompts-item:hover {
          background: var(--transparent-dark-4, rgba(14, 15, 17, 0.04));
        }

        .chat-home__prompts-item-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .chat-home__error {
          width: 100%;
          padding: 12px;
          border: 1px solid #ff820e;
          border-radius: 8px;
          background-color: #ffe8cc;
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
            background-size: 387px 341px;
            padding-top: 102px;
            background-position: top center;
            width: 602px;
            max-width: 100%;
            padding-left: 0;
            padding-right: 0;
          }

          .chat-home__header {
            padding-top: unset;
          }

          .chat-home__title {
            font-size: 28.8px;
            line-height: 34.85px;
            max-width: 587px;
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
        }
      `}</style>
    </>
  );
};

export default ChatHome;
