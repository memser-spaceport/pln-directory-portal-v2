import { ReactElement, useEffect, useState, useMemo } from 'react';

interface IUsePagination {
  items: ReactElement[];
  observerTarget: React.RefObject<HTMLElement>;
}

const ITEMS_PER_PAGE = 30;

const usePagination = ({ items, observerTarget }: IUsePagination) => {
  const [visibleItems, setVisibleItems] = useState<ReactElement[]>(() => items?.slice(0, ITEMS_PER_PAGE));

  const observerCallback = useMemo(() => {
    return (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && visibleItems?.length < items?.length) {
        setVisibleItems((prevVisibleItems) => {
          const newLength = prevVisibleItems?.length + ITEMS_PER_PAGE;
          return items?.slice(0, newLength);
        });
      }
    };
  }, [items, visibleItems]);

  useEffect(() => {
    setVisibleItems(items?.slice(0, ITEMS_PER_PAGE));
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: null, 
      rootMargin: '-500px 0px 0px 0px', 
      threshold: 0.01,
    });

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [observerTarget, observerCallback]);

  return [visibleItems] as const;
};

export default usePagination;
