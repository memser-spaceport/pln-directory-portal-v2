'use client';
import Chat from './chat';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ChatContainer = ({ isLoggedIn, userInfo }: { isLoggedIn: boolean; userInfo: any }) => {
  const [initialMessages, setInitialMessages] = useState<any>(null);
  const router = useRouter();
  useEffect(() => {
    const initialChat = localStorage.getItem('initialChat');
    if (initialChat) {
      setInitialMessages([{ ...JSON.parse(initialChat), isError: false }]);
      localStorage.removeItem('initialChat');
    }
  }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined" && performance?.navigation?.type === 1) {
//       router.push("/husky"); // Redirect on refresh
//     }
//   }, []);
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
