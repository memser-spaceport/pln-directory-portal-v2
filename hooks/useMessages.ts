import { useState, useEffect } from 'react';
import { z } from 'zod';
import { experimental_useObject as useObject } from '@ai-sdk/react';

export const useMessages = (initialMessages: any[] = [], threadId: string) => {
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);

  const {
    object: chatObject,
    isLoading: chatIsLoading,
    submit: submitChat,
    error: chatError,
    stop: stopChat,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/assistant`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      content: z.string(),
      followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
      actions: z
        .array(
          z.object({
            name: z.string(),
            directoryLink: z.string(),
            type: z.string(),
          })
        )
        .optional(),
    }),
    onFinish: () => {
      setIsAnswerLoading(false);
    },
    onError: (error) => {
      console.error('chatError', error);
      setIsAnswerLoading(false);
    },
  });

  const {
    object: sqlObject,
    error: sqlError,
    submit: submitSql,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/analytical`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.array(z.string()),
    onFinish: () => {},
    onError: () => {
      console.error('sqlError', sqlError);
    },
  });

  useEffect(() => {
    if (chatError || sqlError) {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((msg, index) => (index === prev.length - 1 ? { ...msg, answer: '', isError: true } : msg));
      });
    }

    if ((chatObject?.content && chatIsLoading) || sqlObject) {
      setIsAnswerLoading(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: chatObject?.content || newMessages[lastIndex]?.answer || '',
          followUpQuestions: chatObject?.followUpQuestions || newMessages[lastIndex]?.followUpQuestions || [],
          sources: chatObject?.sources || newMessages[lastIndex]?.sources || [],
          actions: chatObject?.actions || newMessages[lastIndex]?.actions || [],
          sql: sqlObject || newMessages[lastIndex] || [],
        };

        return newMessages;
      });
    }
  }, [chatObject, sqlObject, chatIsLoading, chatError]);

  const addMessage = (question: string) => {
    setMessages((prev) => [
      ...prev,
      {
        question,
        answer: '',
        followUpQuestions: [],
        sources: [],
        actions: [],
        sql: [],
      },
    ]);
    setIsAnswerLoading(true);
  };

  useEffect(() => {
    if (initialMessages.length && messages !== initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  

  return {
    messages,
    setMessages,
    isAnswerLoading,
    setIsAnswerLoading,
    addMessage,
    chatIsLoading,
    submitChat,
    stopChat,
    submitSql,
  };
};
