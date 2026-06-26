'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const getHash = () => (typeof window !== 'undefined' ? window.location.hash : undefined);

const useHash = () => {
  const [isClient, setIsClient] = useState(false);
  const [hash, setHash] = useState(getHash());
  const params = useParams();

  useEffect(() => {
    setIsClient(true);

    const updateHash = () => setHash(getHash());
    updateHash();

    window.addEventListener('hashchange', updateHash);

    const { pushState, replaceState } = window.history;
    const wrapHistoryMethod = (original: typeof pushState) =>
      function (this: History, ...args: Parameters<typeof pushState>) {
        const result = original.apply(this, args);
        updateHash();
        return result;
      };

    window.history.pushState = wrapHistoryMethod(pushState);
    window.history.replaceState = wrapHistoryMethod(replaceState);

    return () => {
      window.removeEventListener('hashchange', updateHash);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
    };
  }, [params]);

  return isClient ? hash : null;
};

export default useHash;
