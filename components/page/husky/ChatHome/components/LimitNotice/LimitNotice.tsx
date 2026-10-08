import { useRouter } from 'next/navigation';

import { PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';

import { toast } from '@/components/core/ToastContainer';

import { useCurrentUserStore } from '@/services/auth/store';
import { useLoginRedirect } from '@/components/core/login/utils';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import s from './LimitNotice.module.scss';

export const LimitNotice = () => {
  const router = useRouter();
  const goToLogin = useLoginRedirect();
  const analytics = useHuskyAnalytics();

  const handleSignInClick = () => {
    analytics.trackLoginFromHuskyChat('husky-home-search');
    if (useCurrentUserStore.getState().currentUser) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      goToLogin();
    }
  };

  const handleSignUpClick = () => {
    analytics.trackSignupFromHuskyChat('husky-home-search');
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  return (
    <div className={s.root} data-testid="chat-home-limit">
      <div className={s.warning}>
        <img height={18} width={18} src="/icons/info-orange.svg" alt="info" />
        <span className={s.warningText}>Limit reached</span>
        <span className={s.separator}>|</span>
      </div>
      <div className={s.message}>
        <span onClick={handleSignInClick} className={s.link}>
          Sign in
        </span>
        {` `}or{` `}
        <span onClick={handleSignUpClick} role="link" className={s.link}>
          Sign up{` `}
        </span>
        to get unlimited responses
      </div>
    </div>
  );
};
