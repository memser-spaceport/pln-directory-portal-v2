'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';

export default function PostHogIdentifier() {
  const posthog = usePostHog();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const identifyUser = () => {
      try {
        const userCookie = Cookies.get('userInfo');

        if (userCookie && posthog) {
          const userInfo = getParsedValue(userCookie);

          if (userInfo?.uid || userInfo?.id) {
            const userId = userInfo.uid || userInfo.id;
            const storeKey = `directory-user-identified-${userId}`;
            const isAlreadyIdentifiedInSession = localStorage.getItem(storeKey);

            // Only identify if this is a different user or not identified in this session
            if (lastUserIdRef.current !== userId && !isAlreadyIdentifiedInSession) {
              // Identify user with PostHog
              posthog.identify(userId, {
                email: userInfo.email,
                name: userInfo.name,
                uid: userInfo.uid,
              });

              lastUserIdRef.current = userId;

              // Mark as identified
              localStorage.setItem(storeKey, 'true');
            }
          }
        }
      } catch (error) {
        console.error('PostHog Auto-Identifier error:', error);
      }
    };

    // Identify user on component mount
    identifyUser();
  }, [posthog]);

  // This component doesn't render anything
  return null;
}
