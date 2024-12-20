'use client';

import { useRouter } from 'next/navigation';

export default function LoginInfo() {
  const router = useRouter();
  const onCancel = () => {
    router.push('/');
  };

  const onLogin = async () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  return (
    <>
      <div className="login-info">
        <div className="login-info__title">Login to submit a team</div>
        <div className="login-info__subtitle">You need to log in to submit a team.Please login to proceed.</div>
        <div className='login-info__actions'>
            <button onClick={onCancel} className="login-info__actions__cancel" type="button">
              Cancel
            </button>
            <button className="login-info__actions__login" onClick={onLogin}>Proceed to Login</button>
        </div>
      </div>
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
