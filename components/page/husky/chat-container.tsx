'use client';

import { useEffect, useState } from 'react';
import Chat from './chat';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import ChatHeader from './chat-header';
import { useRouter } from 'next/navigation';
import { IVisitChat, OPEN_VISIT_CHAT_EVENT, getVisitChat, takePendingVisitChat } from '@/utils/husky-visit-chats';

interface ChatContainerProps {
  isLoggedIn: boolean;
  userInfo: any;
}

const ChatContainer = ({ isLoggedIn, userInfo }: ChatContainerProps) => {
  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [type, setType] = useState<string>('');
  // a signed-out visitor's chat from this visit, reopened from the History rail
  const [visitThreadId, setVisitThreadId] = useState<string | undefined>();
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const resetChat = () => {
    setInitialMessages([]);
    setType('');
    setVisitThreadId(undefined);
    analytics.trackMobileHeaderNewConversationClicked();
  };

  const openVisitChat = (chat: IVisitChat | null) => {
    if (!chat) return;
    setType('');
    setVisitThreadId(chat.threadId);
    setInitialMessages(chat.messages);
  };

  useEffect(() => {
    const handleOpenVisitChat = (e: Event) => {
      const threadId = (e as CustomEvent<{ threadId: string }>).detail?.threadId;
      takePendingVisitChat();
      openVisitChat(threadId ? getVisitChat(threadId) : null);
    };
    // a chat picked in the rail on another page: open it once this page is mounted
    const pendingChat = takePendingVisitChat();
    if (pendingChat) {
      queueMicrotask(() => openVisitChat(pendingChat));
    }
    document.addEventListener(OPEN_VISIT_CHAT_EVENT, handleOpenVisitChat);
    return () => {
      document.removeEventListener(OPEN_VISIT_CHAT_EVENT, handleOpenVisitChat);
    };
  }, []);

  useEffect(() => {
    // Retrieve and parse initial chat message from local storage
    const initialChat = localStorage.getItem('initialChat');
    if (initialChat) {
      try {
        const parsedChat = JSON.parse(initialChat);
        localStorage.removeItem('initialChat');
        queueMicrotask(() => {
          setType(parsedChat.type);
          setInitialMessages([{ ...parsedChat.message, isError: false }]);
        });
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
        <ChatHeader resetChat={resetChat} />
        <div className="chat-container__body">
          <Chat
            id={visitThreadId}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            initialMessages={initialMessages}
            setInitialMessages={setInitialMessages}
            from={type}
            setType={setType}
          />
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
