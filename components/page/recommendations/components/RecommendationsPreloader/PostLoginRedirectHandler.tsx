'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const PostLoginRedirectHandler = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const openProfileAfterLogin = searchParams.get('openProfileAfterLogin');
  const profileOpenedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !openProfileAfterLogin || profileOpenedRef.current) {
      return;
    }
    profileOpenedRef.current = true;
    setTimeout(() => {
      window.open(`/members/${openProfileAfterLogin}`, '_blank');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('openProfileAfterLogin');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 700);
  }, [isLoggedIn, openProfileAfterLogin, pathname, router, searchParams]);

  useEffect(() => {
    if (!returnTo) {
      return;
    }

    if (!isLoggedIn) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('returnTo');

    const path = `/${returnTo.replace('-', '/')}`;

    setTimeout(() => {
      router.replace(`${path}?${params.toString()}`);
    }, 700);
  }, [isLoggedIn, returnTo, router, searchParams]);

  return null;
};

export default PostLoginRedirectHandler;
