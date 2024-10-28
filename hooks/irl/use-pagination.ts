import { useEffect, useState } from 'react';

const usePagination = (props: any) => {
  const observerTarget = props.observerTargetRef;
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const totalItems = props.totalItems;
  const totalCurrentItems = props.totalCurrentItems;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && totalItems !== totalCurrentItems) {
          setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      { threshold: 0.1, }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, totalCurrentItems, totalItems]);

  return { currentPage: pagination.page, limit: pagination.limit, setPagination };
};

export default usePagination;
