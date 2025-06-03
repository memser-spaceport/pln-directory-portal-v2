'use client';
import { IMember } from '@/types/members.types';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { clsx } from 'clsx';

import s from './MemberDetailsLoginStrip.module.scss';

interface IMemberProfileLoginStrip {
  member: IMember;
  variant?: 'primary' | 'secondary';
}

export const MemberProfileLoginStrip = ({ member, variant = 'primary' }: IMemberProfileLoginStrip) => {
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
      <div
        className={clsx(s.root, {
          [s.secondary]: variant === 'secondary',
        })}
      >
        <div className={s.content}>
          <span className={s.loginIcon}>
            <img loading="lazy" alt="lock" src={variant === 'secondary' ? '/icons/lock.svg' : '/icons/lock-blue.svg'} />
          </span>
          <p>
            You are viewing <span className={s.descName}>{member?.name.concat("'s")}</span> limited profile.
            <span className={s.loginButton} onClick={onLoginClickHandler}>
              &nbsp;Login
            </span>
            &nbsp;to access details such as social profiles, projects & office hours.
          </p>
        </div>
      </div>
    </>
  );
};

export default MemberProfileLoginStrip;
