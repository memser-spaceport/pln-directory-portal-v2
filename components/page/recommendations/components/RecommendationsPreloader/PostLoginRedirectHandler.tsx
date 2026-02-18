'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const PostLoginRedirectHandler = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

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
