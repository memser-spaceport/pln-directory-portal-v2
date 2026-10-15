'use client';

import { useEffect, useState } from 'react';

import { generateUUID } from '@/utils/common.utils';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import type { IVisitChat } from '../types/visitChat';

import { OPEN_VISIT_CHAT_EVENT } from '../constants/visitChats';

import { takePendingVisitChat } from '../utils/takePendingVisitChat';

import { Chat } from '../Chat';

import s from './ChatContainer.module.scss';

interface Props {
  isLoggedIn: boolean;
}

export const ChatContainer = (props: Props) => {
  const { isLoggedIn } = props;

  const [initialMessages, setInitialMessages] = useState<any>([]);
  const [type, setType] = useState<string>('');
  const [visitThreadId, setVisitThreadId] = useState<string | undefined>();
  // Each new chat mounts a fresh Chat, which asks a question handed over by the header search.
  const [newChatCount, setNewChatCount] = useState(0);
  const analytics = useHuskyAnalytics();

  const resetChat = () => {
    setInitialMessages([]);
    setType('');
    setVisitThreadId(undefined);
    setNewChatCount((count) => count + 1);
    analytics.trackMobileHeaderNewConversationClicked();
  };

  const openVisitChat = (chat: IVisitChat | null) => {
    if (!chat) {
      return;
    }
    setType('');
    setVisitThreadId(chat.threadId);
    setInitialMessages(chat.messages);
  };

  useEffect(() => {
    const handleOpenVisitChat = () => openVisitChat(takePendingVisitChat());
    // A chat picked in the rail on another page opens once this page is mounted.
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
    const initialChat = localStorage.getItem('initialChat');
    if (initialChat) {
      try {
        const parsedChat = JSON.parse(initialChat);
        localStorage.removeItem('initialChat');
        queueMicrotask(() => {
          setType(parsedChat.type);
          setInitialMessages([{ ...parsedChat.message, id: generateUUID(), isError: false }]);
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
    <div className={s.root}>
      <div className={s.body}>
        <Chat
          key={visitThreadId ?? `new-chat-${newChatCount}`}
          id={visitThreadId}
          isLoggedIn={isLoggedIn}
          initialMessages={initialMessages}
          setInitialMessages={setInitialMessages}
          from={type}
          setType={setType}
        />
      </div>
    </div>
  );
};
