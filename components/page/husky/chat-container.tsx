'use client';

import { useEffect, useState } from 'react';
import Chat from './chat';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import ChatHeader from './chat-header';
import { useRouter } from 'next/navigation';

interface ChatContainerProps {
  isLoggedIn: boolean;
  userInfo: any;
}

const ChatContainer = ({ isLoggedIn, userInfo }: ChatContainerProps) => {
  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [type, setType] = useState<string>('');
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const resetChat = () => {
    setInitialMessages([]);
    setType('');
    analytics.trackMobileHeaderNewConversationClicked();
  }

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

    document.addEventListener('new-chat', resetChat);
    return () => {
      document.removeEventListener('new-chat', resetChat);
    };
  }, []);


  return (
    <>
      <div className="chat-container">
        {isLoggedIn && <ChatHeader resetChat={resetChat} />}
        <div className="chat-container__body">
          <Chat isLoggedIn={isLoggedIn} userInfo={userInfo} initialMessages={initialMessages} setInitialMessages={setInitialMessages} from={type} setType={setType} />
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
      `}</style>
    </>
  );
};

export default ChatContainer;
