import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { experimental_useObject as useObject } from '@ai-sdk/react';

export const useMessages = (initialMessages: any[] = [], threadId: string) => {
  const [messages, setMessages] = useState<any[]>(initialMessages ?? []);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [currentChatUid, setCurrentChatUid] = useState<string | undefined>();

  console.log("threadId2", threadId);
  const test = useCallback(async () => {
    console.log("test");
    console.log("hook threadId", threadId);
  }, [threadId]);

  
  const {
    object,
    isLoading: isLoadingObject,
    submit,
    error,
    stop
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/contextual`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      content: z.string(),
    //   followUpQuestions: z.array(z.string()),
      sources: z.array(z.string()).optional(),
    //   actions: z
    //     .array(
    //       z.object({
    //         name: z.string(),
    //         directoryLink: z.string(),
    //         type: z.string(),
    //       })
    //     )
        // .optional(),
    }),
    onFinish: test,
    onError: (error) => {
      console.error(error);
      setIsAnswerLoading(false);
    },
  });



  const {
    object: analyticalObject,
    error: analyticalError,
    submit: submitAnalytical,
  } = useObject({
    api: `${process.env.DIRECTORY_API_URL}/v1/husky/chat/analytical`,
    headers: {
      'Content-Type': 'application/json',
    },
    schema: z.object({
      sql: z.array(z.string()),
    }),
    onFinish: async () => {
    },
    onError: () => {
    },
  });


//   useEffect(() => {
//     if(isLoadingObject === '') {
//       getAdditionalInfo();
//     }
//   }, [threadId, isLoadingObject]);

  const getAdditionalInfo = useCallback(async () => {
    console.log("Getting additional info for uid:", threadId);
    if (threadId) {
      try {
        const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/husky/chat/${threadId}/additional-info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const additionalInfo = await response.json();
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              followUpQuestions: additionalInfo.followUpQuestions || newMessages[lastIndex].followUpQuestions,
              actions: additionalInfo.actions || newMessages[lastIndex].actions,
            };
            return newMessages;
          });
        }
      } catch (error) {
        console.error('Error fetching additional info:', error);
      }
    }
  }, [threadId, setMessages]);

  useEffect(() => {
    if (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: '',
          isError: true,
        };
        return newMessages;
      });
    }

    if ((object?.content && isLoadingObject) || analyticalObject?.sql) {
      setIsAnswerLoading(false);
      setMessages((prev) => {
        if (prev.length === 0) {
          return [
            {
              answer: object?.content || '',
              followUpQuestions: object?.followUpQuestions || [],
              sources: object?.sources || [],
              actions: object?.actions || [],
              sql: analyticalObject || [],
            },
          ];
        }

        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          answer: object?.content || newMessages[lastIndex]?.answer || '',
          followUpQuestions: object?.followUpQuestions || newMessages[lastIndex]?.followUpQuestions || [],
          sources: object?.sources || newMessages[lastIndex]?.sources || [],
          actions: object?.actions || newMessages[lastIndex]?.actions || [],
          sql: analyticalObject || newMessages[lastIndex] || [],
        };

        return newMessages;
      });
    }
  }, [object, analyticalObject, isLoadingObject, error]);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const addMessage = (question: string) => {
    setMessages((prev) => [
      ...prev,
      {
        question,
        answer: '',
        followUpQuestions: [],
        sources: [],
        actions: [],
      },
    ]);
    setIsAnswerLoading(true);
  };

  const submitWithUid = (params: { uid: string; question: string }) => {
    console.log('Setting currentChatUid in submitWithUid:', params.uid);
    setCurrentChatUid(params.uid);
    submitAnalytical(params);
  };

  useEffect(() => {
    console.log('currentChatUid changed:', currentChatUid);
  }, [currentChatUid]);

//   useEffect(() => {
//     if (currentChatUid) {
//       getAdditionalInfo(currentChatUid);
//     }
//   }, [currentChatUid, getAdditionalInfo]);

  return {
    messages,
    setMessages,
    isAnswerLoading,
    setIsAnswerLoading,
    addMessage,
    isLoadingObject,
    submit,
    stop,
    submitAnalytical: submitWithUid,
  };
};
