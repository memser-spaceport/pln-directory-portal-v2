import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * SignUpSuccess component displays a success message after a user has signed up.
 * It shows an image indicating the profile is under review, a title, a descriptive text,
 * and a button to navigate back to the home page.
 *
 * @component
 * @example
 * return (
 *   <SignUpSuccess />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @remarks
 * This component uses the `useRouter` hook from Next.js to handle navigation
 * and a custom `useSignUpAnalytics` hook to record analytics events.
 *
 * @function
 * @name SignUpSuccess
 */
const SignUpSuccess = () => {
  const router = useRouter();
  const analytics = useSignUpAnalytics();

  /**
   * Handles the click event for the "Back to Home" button.
   * Navigates the user to the home page and records the click event for analytics.
   *
   * @returns {void}
   */
  const onBackToHomeClick = () => {
    router.push('/');
    analytics.recordHomeClickAfterSuccess();
  };

  return (
    <>
      <div className="sign-up-success__cn">
        <div>
          <Image src="/images/sign-up/under-review.svg" alt="under-review" width={148} height={148} />
        </div>
        <div className="sign-up-success__cn__info">
          <div className="sign-up-success__cn__info__title">Profile Under Review</div>
          <div className="sign-up-success__cn__info__text">Thank you for signing up! Your profile is currently under review. You’ll receive an email as soon as it’s approved.</div>
          <div>
            <button className="sign-up-success__cn__info__action" onClick={onBackToHomeClick}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .sign-up-success__cn {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          background-color: white;
          border-radius: 12px;
          padding: 32px;
          gap: 32px;
        }

        .sign-up-success__cn__info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sign-up-success__cn__info__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .sign-up-success__cn__info__text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #0f172a;
        }

        .sign-up-success__cn__info__action {
          padding: 10px 24px 10px 24px;
          gap: 8px;
          border-radius: 8px;
          border: 1px 0px 0px 0px;
          opacity: 0px;
          background-color: #156ff7;
          border: 1px solid #cbd5e1;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          color: #cbd5e1;
        }
      `}</style>
    </>
  );
};

export default SignUpSuccess;
