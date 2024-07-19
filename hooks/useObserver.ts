import { RefObject, useEffect } from 'react';

interface useObserverProps {
  callback: () => Promise<any>;
  observeItem: RefObject<HTMLDivElement | HTMLFormElement>;
}

function useObserver({ callback, observeItem }: useObserverProps) {
  useEffect(() => {
    // MutationObserver callback
    const observerCallback = async (mutationsList: any) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          await callback();
        }
      }
    };

    // Create a MutationObserver
    const observer = new MutationObserver(observerCallback);

    // Observe changes in the form
    if (observeItem.current) {
      observer.observe(observeItem.current, { childList: true, subtree: true, attributes: true });
    }

    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [callback]);
}

export default useObserver;
