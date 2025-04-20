'use client';

import { useRouter } from 'next/navigation';

/**
 * Props for the LoginInfo component.
 * Currently, this component does not accept any props, but the interface is defined for future extensibility.
 */
export interface LoginInfoProps {}

/**
 * LoginInfo component displays a prompt for users to log in before submitting a team.
 * It provides Cancel and Proceed to Login actions, and handles navigation accordingly.
 *
 * @component
 * @example
 * return <LoginInfo />
 */
export default function LoginInfo(_props: LoginInfoProps) {
  const router = useRouter();

  // Handler for the Cancel button - navigates to the home page
  const onCancel = () => {
    router.push('/');
  };

  // Handler for the Proceed to Login button - navigates to the login section
  const onLogin = async () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  return (
    <>
      {/* Main container for login info */}
      <div className="login-info">
        <div className="login-info__title">Login to submit a team</div>
        <div className="login-info__subtitle">You need to log in to submit a team.Please login to proceed.</div>
        <div className='login-info__actions'>
            {/* Cancel button */}
            <button onClick={onCancel} className="login-info__actions__cancel" type="button">
              Cancel
            </button>
            {/* Proceed to Login button */}
            <button className="login-info__actions__login" onClick={onLogin}>Proceed to Login</button>
        </div>
      </div>
      {/* styles for the component */}
      <style jsx>
        {`
          .login-info {
            display: flex;
            width: 100%;
            flex-direction: column;
            padding: 32px;
            gap: 20px;
          }

          .login-info__title {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .login-info__subtitle {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .login-info__actions{
            display:flex;
            justify-content: flex-end;
            gap:10px;
          }

          .login-info__actions__cancel {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }

          .login-info__actions__login {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #156ff7;
            cursor: pointer;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
        `}
      </style>
    </>
  );
}
