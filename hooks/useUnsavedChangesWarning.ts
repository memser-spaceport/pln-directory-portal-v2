import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const useBlockNavigation = (shouldBlock: boolean, allowedRoutes: string[] = []) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAttemptingNavigation, setIsAttemptingNavigation] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const originalPushRef = useRef(router.push);
  const lastLocationRef = useRef<string | null>(null);

  const canNavigate = (url: string) => {
    const { pathname } = new URL(url, window.location.origin);
    return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
  };

  useEffect(() => {
    const handleNavigation = (url: string) => {
      if (!shouldBlock || canNavigate(url) || url === pathname) {
        originalPushRef.current(url);
        return;
      }
      setIsAttemptingNavigation(true);
      setNextRoute(url);
    };
    router.push = ((url, _options) => {
      handleNavigation(url);
    }) as typeof router.push;
    return () => {
      router.push = originalPushRef.current;
    };
  }, [shouldBlock, pathname, allowedRoutes]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlock) {
        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      if (shouldBlock) {
        event.preventDefault();
        const previousURL = lastLocationRef.current || document.referrer || '/';
        setIsAttemptingNavigation(true);
        setNextRoute(previousURL);
        history.pushState(null, '', window.location.href);
      }
    };

    lastLocationRef.current = pathname;
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [shouldBlock, pathname]);

  const proceedNavigation = () => {
    if (nextRoute) {
      setIsAttemptingNavigation(false);
      originalPushRef.current(nextRoute);
      setNextRoute(null);
    }
  };

  const cancelNavigation = () => {
    setIsAttemptingNavigation(false);
    setNextRoute(null);
  };
  return { isAttemptingNavigation, proceedNavigation, cancelNavigation };
};

export default useBlockNavigation;
