'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createStateUid } from '@/services/auth.service';
import { useAsync } from 'react-use';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';

const AuthInfo = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAuthAnalytics();
  const { logout } = usePrivyWrapper();

  // Initiate Privy Login and get the auth code for state
  useAsync(async () => {
    try {
      console.log('login triggered');
      analytics.onProceedToLogin();
      localStorage.clear();

      await logout();

      const response = await createStateUid();
      if (!response.ok) {
        throw new Error(`Error while getting stateUid: ${response.status}`);
      }

      if (response.ok) {
        const result = response.data;
        localStorage.setItem('stateUid', result);

        const onboardingEmail = searchParams.get('prefillEmail');

        if (onboardingEmail) {
          localStorage.setItem('prefillEmail', onboardingEmail);
        }

        document.dispatchEvent(new CustomEvent('privy-init-login'));
        router.push(`${window.location.pathname}${window.location.search}`);
      }
    } catch (err) {
      console.log('Login Failed', err);
    }
  }, []);

  return (
    <>
      <div className="loaderc">
        <div className="loaderc__lo">
          <svg aria-hidden="true" className="loaderc__lo__spinner" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          Loading...
        </div>
      </div>

      <style jsx>
        {`
          .loaderc {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: 999;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            color: #000;
            animation: fadeIn 0.5s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          .fade-out {
            animation: fadeOut 1s ease-in-out;
          }

          .loaderc__lo {
            display: flex;
            background: white;
            padding: 20px;
            border-radius: 10px;
            align-items: center;
          }

          .loaderc__lo__spinner {
            margin-right: 8px;
            height: 20px;
            width: 20px;
            fill: blue;
            color: gray;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};

export default AuthInfo;
