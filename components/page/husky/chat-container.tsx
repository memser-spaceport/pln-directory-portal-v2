'use client';

import { useEffect, useState } from 'react';
import Chat from './chat';

const ChatContainer = ({ isLoggedIn, userInfo }: { isLoggedIn: boolean; userInfo: any }) => {
  const [initialMessages, setInitialMessages] = useState<any>([]);
  
  useEffect(() => {
    // Retrieve and parse initial chat message from local storage
    const initialChat = localStorage.getItem('initialChat');
    if (initialChat) {
      try {
        const parsedChat = JSON.parse(initialChat);
        setInitialMessages([{ ...parsedChat, isError: false }]);
        localStorage.removeItem('initialChat');
      } catch (error) {
        console.error('Error parsing initial chat:', error);
      }
    }

    const handler = (e: Event) => {
      console.log('new-chat-box', e);
      setInitialMessages([]);
    };

    document.addEventListener('new-chat-box', handler);
    return () => {
      document.removeEventListener('new-chat-box', handler);
    };
  }, []);

  return (
    <>
      <Chat isLoggedIn={isLoggedIn} userInfo={userInfo} initialMessages={initialMessages} />
      <style jsx>{`
        .chat-container {
          min-height: inherit;
        }
      `}</style>
    </>
  );
};

export default ChatContainer;
