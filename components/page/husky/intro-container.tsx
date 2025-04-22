'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import IntroHeader from './intro/intro-header';
import Intro from './intro/intro';
import { INTRO_INITIAL_MESSAGES } from '@/utils/constants';
interface ChatContainerProps {
  isLoggedIn: boolean;
  userInfo: any;
}

const IntroContainer = ({ isLoggedIn, userInfo }: ChatContainerProps) => {
  const [initialMessages, setInitialMessages] = useState<any>(INTRO_INITIAL_MESSAGES);
  const [type, setType] = useState<string>('');
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const resetChat = () => {
    setInitialMessages([]);
    setType('');
    analytics.trackMobileHeaderNewConversationClicked();
  };

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
        {isLoggedIn && <IntroHeader resetChat={resetChat} />}
        <div className="chat-container__body">
          <Intro isLoggedIn={isLoggedIn} userInfo={userInfo} initialMessages={initialMessages} />
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
          background-color: #F4FAFF;
          background-image: url('/images/husky/husky-backgorund.jpg');
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          position: relative;
          overflow: auto;
        }
      `}</style>
    </>
  );
};

export default IntroContainer;
