'use client';
import { IMember } from '@/types/members.types';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

interface IMemberProfileLoginStrip {
  member: IMember;
}
const MemberProfileLoginStrip = (props: IMemberProfileLoginStrip) => {
  const member = props?.member;
  const router = useRouter();
  const authAnalytics = useAuthAnalytics();

  const onLoginClickHandler = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      authAnalytics.onLoginBtnClicked();
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };
  return (
    <>
      <div className="login-strip">
        <div className="login-strip__content">
          <span className="login-strip__content__log-icon">
            <img loading="lazy" alt="lock" src="/icons/lock-blue.svg" />
          </span>
          <p className="login-strip__content__desc">
            You are viewing <span className="login-strip__content-desc__name">{member?.name.concat("'s")}</span> limited profile.
            <span className="login-strip__content__login" onClick={onLoginClickHandler}>
              &nbsp;Login
            </span>
            &nbsp;to access details such as social profiles, projects & office hours.
          </p>
        </div>
      </div>

      <style jsx>
        {`
          .login-strip {
            border-radius: 8px 8px 0 0;
            padding: 8px, 16px, 8px, 16px;
            border-radius: 8px, 8px, 0px, 0px;
            background: #dbeafe;
            font-size: 12px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0.01em;
            text-align: left;
            display: flex;
            gap: 4px;
            color: #000;
            justify-content: center;
          }

          .login-strip__content {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 8px 16px;
          }

          .login-strip__content__desc {
          }

          .login-strip__content__log-icon {
            margin-top: 3px;
          }

          .login-strip__content__login {
            color: #1d4ed8;
            font-weight: 700;
            cursor: pointer;
          }

          .login-strip__content-desc__name {
            max-width: 300px;
            overflow: hidden;
            word-break: break-word;
            text-overflow: ellipsis;
            break-work: nowrap;
          }

          @media (min-width: 1024px) {
            .login-strip__content {
              gap: 4px;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberProfileLoginStrip;
