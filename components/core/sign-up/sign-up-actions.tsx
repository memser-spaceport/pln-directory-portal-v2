import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { useRouter } from 'next/navigation';

/**
 * SignUpActions component renders action buttons for the sign-up process.
 * It includes a "Cancel" button that navigates back to the home page and records
 * a sign-up cancellation event, and a "Sign Up" button to submit the sign-up form.
 *
 * @component
 * @example
 * return (
 *   <SignUpActions />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 */
const SignUpActions = () => {
  const router = useRouter();
  const analytics = useSignUpAnalytics();

  /**
   * Handles the cancel action during the sign-up process.
   * 
   * This function performs the following actions:
   * 1. Records the sign-up cancellation event using the analytics service.
   * 2. Redirects the user to the home page.
   * 
   * @returns {void}
   */
  const handleCancel = () => {
    analytics.recordSignUpCancel();
    router.push('/');
  };

  return (
    <>
      <div className="sign-up-actions__cn">
        <button
          type="button"
          onClick={handleCancel}
          className="sign-up-actions__cn__cancel"
        >
          Cancel
        </button>
        <button type="submit" className="sign-up-actions__cn__submit">
          Sign Up
        </button>
      </div>
      <style jsx>{`
        .sign-up-actions__cn {
          display: flex;
          justify-content: flex-end;
          padding: 16px 32px;
          gap: 8px;
          border-top: 1px solid #cbd5e1;
        }
        .sign-up-actions__cn__submit {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #156ff7;
          cursor: pointer;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .sign-up-actions__cn__cancel {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default SignUpActions;
