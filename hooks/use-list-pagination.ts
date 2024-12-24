import { useEffect, useState } from 'react';

const useListPagination = (props: any) => {
  const observerTarget = props.observerTargetRef;
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const totalItems = props.totalItems;
  const totalCurrentItems = props.totalCurrentItems;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      {
        root: document.body,
        rootMargin: '0px 0px 900px 0px',
        threshold: 0,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, []);

  return { currentPage: pagination.page, limit: pagination.limit, setPagination };
};

export default useListPagination;
