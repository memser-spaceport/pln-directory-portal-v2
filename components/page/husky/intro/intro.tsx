'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobileDevice } from '@/utils/common.utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import ChatInput from '../chat-input';
import HuskyOptions from '../../home/husky/husky-options';
import { useChat, Message } from '@ai-sdk/react';
import IntroMessage from './intro-message';
import { useSidebar } from '../sidebar';
interface ChatProps {
  isLoggedIn: boolean;
  userInfo: any;
  initialMessages: any;
}

const Chat: React.FC<ChatProps> = ({ isLoggedIn, userInfo, initialMessages }) => {
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { state } = useSidebar();
  const analytics = useHuskyAnalytics();
  const id = '123';

  const { messages, append, input, handleInputChange, handleSubmit, status, addToolResult, setInput, setMessages } = useChat({
    id,
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chatbot/intro`,
    body: { id },
    initialMessages,
    onFinish: () => {
      // window.history.replaceState({}, "", `//${id}`);
    },
  });

  // scroll to the bottom of the chat when new message is added
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 1) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [status]);

  // handle submit by clicking the send button
  const submitForm = (event: any) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    handleSubmit(event);
    setQuestion(input);
  };

  // handle submit by pressing enter key
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitForm(event);
    }
  };

  // handle stop streaming
  const onStopStreaming = useCallback(() => {
    analytics.trackHuskyChatStopBtnClicked(question);
    // Add stop functionality here
  }, [question, analytics]);

  return (
    <>
      <div className="chat" ref={chatContainerRef}>
        <div className="chat__messages-wrapper">
          <div className="chat__messages-wrapper__options">
            <HuskyOptions selectedOption="intro" />
          </div>

          {/* Display messages with tool invocations */}
          <div className="messages-container">
            {messages.map((message: any, index: number) => (
              <div key={`${message.id}-${index}`} className={`message-content ${message.role === 'user' ? 'user' : 'assistant'}`}>
                <IntroMessage append={append} message={message} setInput={setInput} handleSubmit={handleSubmit} userInfo={userInfo} />
              </div>
            ))}
            {status === 'submitted' && (
              <div className={`message-content ${messages[messages.length - 1]?.role === 'user' ? 'assistant' : 'user'}`}>
                <div className="message-skeleton">
                  <div className="skeleton-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div data-state={isLoggedIn ? state : ''} className="chat__form-wrapper">
          <form className="chat__form" onSubmit={submitForm}>
            <ChatInput
              ref={textareaRef}
              placeholder="Go ahead, ask anything!"
              rows={isMobileDevice() ? 1 : 2}
              autoFocus
              onKeyDown={handleKeyDown}
              onTextSubmit={submitForm}
              onStopStreaming={onStopStreaming}
              isAnswerLoading={status === 'streaming' ? true : false}
              isLoadingObject={false}
              isLimitReached={true}
              value={input}
              onChange={handleInputChange}
            />
          </form>
        </div>
      </div>

      <style jsx>{`
        .chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 954px;
          margin: 0px auto;
          position: relative;
          overflow: hidden;
          padding: 26px 0px 90px 0px;
          min-height: 100vh;
        }

        .chat__messages-wrapper {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .chat__messages-wrapper__options {
          position: fixed;
        }

        .messages-container {
          width: 100%;
          padding: 0 20px;
          margin-top: 60px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-header {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .message-skeleton {
          padding: 12px 16px;
          border-radius: 8px;
          background-color: ${messages[messages.length - 1]?.role === 'user' ? '#f1f5f9' : 'transparent'};
          min-height: 40px;
          display: flex;
          align-items: center;
        }

        .skeleton-dots {
          display: flex;
          gap: 4px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #cbd5e1;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }

        .user {
          align-self: flex-end;
          width: 50%;
        }

        .assistant {
          align-self: flex-start;
          width: 50%;
        }

        .chat__form-wrapper {
          position: fixed;
          width: calc(100% - 20px);
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          z-index: 1;
          display: flex;
          justify-content: center;
        }

        .chat__form {
          padding-bottom: 10px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .chat__form-wrapper {
            width: 989px;
          }

          .chat__form {
            padding: 20px;
          }

          .chat__form-wrapper[data-state='expanded'] {
            left: calc(50% + 150px);
          }

          .chat__form-wrapper[data-state='collapsed'] {
            left: calc(50% + 32px);
          }
        }
      `}</style>
    </>
  );
};

export default Chat;
