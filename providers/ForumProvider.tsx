'use client';

import React, { useEffect, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface ForumMessage {
  id: string;
  threadId: string;
  content: string;
  author: string;
  createdAt: string;
}

const ForumSocketContext = createContext<Socket | null>(null);

const socket: Socket = io('http://localhost:4567/socket.io', {
  transports: ['websocket'],
  autoConnect: true,
});

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNewMessage = (message: ForumMessage) => {
      queryClient.setQueryData<ForumMessage[]>(['forumMessages', message.threadId], (old = []) => [...old, message]);
    };

    const handleDeleteMessage = ({ id, threadId }: { id: string; threadId: string }) => {
      queryClient.setQueryData<ForumMessage[]>(['forumMessages', threadId], (old = []) => old.filter((msg) => msg.id !== id));
    };

    const handleUpdateMessage = (message: ForumMessage) => {
      queryClient.setQueryData<ForumMessage[]>(['forumMessages', message.threadId], (old = []) => old.map((msg) => (msg.id === message.id ? message : msg)));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageDeleted', handleDeleteMessage);
    socket.on('messageUpdated', handleUpdateMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleDeleteMessage);
      socket.off('messageUpdated', handleUpdateMessage);
    };
  }, [queryClient]);

  return <ForumSocketContext.Provider value={socket}>{children}</ForumSocketContext.Provider>;
};

// optional helper
export const useForumSocket = () => useContext(ForumSocketContext);
