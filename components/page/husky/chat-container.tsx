'use client';

import { useCallback, useEffect, useState } from 'react';
import Chat from './chat';
import { useSidebar } from './sidebar';
import { getHuskyThreadById } from '@/services/husky.service';
import { triggerLoader } from '@/utils/common.utils';
import { getUserCredentials } from '@/utils/auth.utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

interface ChatContainerProps {
  isLoggedIn: boolean;
  userInfo: any;
}

const ChatContainer = ({ isLoggedIn, userInfo }: ChatContainerProps) => {
  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [threadUid, setThreadUid] = useState<any>(null);
  const [type, setType] = useState<string>('chat');
  const { toggleSidebar } = useSidebar();
  const analytics = useHuskyAnalytics();

  const handleToggleSidebar = () => {
    toggleSidebar();
    analytics.trackMobileHeaderToggleClicked();
  };

  const resetChat = useCallback(() => {
    setInitialMessages([]);
    setType('chat');
    setThreadUid(null);
    analytics.trackMobileHeaderNewConversationClicked();
  }, []);

  useEffect(() => {
    // Retrieve and parse initial chat message from local storage
    const initialChat = localStorage.getItem('initialChat');
    if (initialChat) {
      try {
        const parsedChat = JSON.parse(initialChat);
        setType(parsedChat.type);
        setInitialMessages([{ ...parsedChat.message, isError: false }]);
        localStorage.removeItem('initialChat');
      } catch (error) {
        console.error('Error parsing initial chat:', error);
      }
    }

    const updateMessages = (e: any) => {
      const { threadUid } = e.detail;
      setThreadUid(threadUid);

      const fetchThread = async () => {
        const { authToken } = await getUserCredentials(isLoggedIn);
        const thread = await getHuskyThreadById(threadUid, authToken);
        setInitialMessages(thread);
        triggerLoader(false);
        const scrollableElement = document.querySelector('body');

        scrollableElement?.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      };

      if (threadUid) {
        fetchThread();
      }
    };

    document.addEventListener('new-chat', resetChat);
    document.addEventListener('update-messages', updateMessages);
    return () => {
      document.removeEventListener('new-chat', resetChat);
      document.removeEventListener('update-messages', updateMessages);
    };
  }, []);

  return (
    <>
      <div className="chat-container">
        {isLoggedIn && (
          <div className="chat-container__header">
            <button onClick={handleToggleSidebar} className="chat-container__header__thread-list-button">
              <img src="/icons/message-blue-v2.svg" alt="thread-list" />
            <span className="chat-container__header__thread-list-button__text">Threads</span>
          </button>
          <button onClick={resetChat} className="chat-container__header__new-conversation-button">
            <img src="/icons/add-blue.svg" alt="new-conversation" />
            <span className="chat-container__header__new-conversation-button__text">New Conversation</span>
            </button>
          </div>
        )}
        <div className="chat-container__body">
          <Chat threadUid={threadUid} setThreadUid={setThreadUid} isLoggedIn={isLoggedIn} userInfo={userInfo} initialMessages={initialMessages} from={type} setType={setType} />
        </div>
      </div>
      <style jsx>{`
        .chat-container {
          min-height: inherit;
          display: flex;
          flex-direction: column;
        }

        .chat-container__body {
          flex: 1;
          overflow-y: auto;
        }

        .chat-container__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 40px;
          background-color: #dbeafe;
          padding: 8px 12px;
          position: sticky;
          top: 80px;
          z-index: 1;
        }

        .chat-container__header__thread-list-button,
        .chat-container__header__new-conversation-button {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 30px;
          background-color: #fff;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          padding: 3px 8px;
        }

        .chat-container__header__thread-list-button__text,
        .chat-container__header__new-conversation-button__text {
          font-weight: 500;
          font-size: 13px;
          line-height: 14px;
          color: #156ff7;
        }

        button {
          background-color: transparent;
        }

        @media (min-width: 768px) {
          .chat-container__header {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default ChatContainer;
