'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import AuthInfo from './auth-info';
import useHash from '@/hooks/useHash';
import PrivyModals from './privy-modals';
import AuthInvalidUser from './auth-invalid-user';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

function AuthBox() {
  const hash = useHash();

  const isLoginPopup = '#login' === hash;
  const router = useRouter();

  useEffect(() => {
    //restrict the user to manually open the login modal when authendicated state
    if (Cookies.get('refreshToken')) {
      router.push(`${window.location.pathname}${window.location.search}`);
    }
  }, []);

  return (
    <PrivyProvider
      appId={process.env.PRIVY_AUTH_ID as string}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          landingHeader: 'PL People Login',
        },
        loginMethods: ['email', 'google', 'github', 'wallet'],
      }}
    >
      <PrivyModals />
      <AuthInvalidUser />
      {isLoginPopup && <AuthInfo />}
    </PrivyProvider>
  );
}

export default AuthBox;
