import Link from 'next/link';

import { PAGE_ROUTES } from '@/utils/constants';

import { Button } from '@/components/common/Button';
import { useLoginRedirect } from '@/components/core/login/utils';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';

import s from './AuthSection.module.scss';

interface AuthSectionProps {
  memberUid?: string;
  memberName?: string;
  activeTab?: ActiveTab;
}

export function AuthSection(props: AuthSectionProps) {
  const { memberUid, memberName, activeTab } = props;
  const { onMemberProfileForumActivitySignInClicked, onMemberProfileForumActivitySignUpClicked } = useForumAnalytics();
  const goToLogin = useLoginRedirect();

  const handleSignInClick = () => {
    if (memberUid && memberName && activeTab) {
      onMemberProfileForumActivitySignInClicked({
        memberUid,
        memberName,
        activeTab,
      });
    }
    goToLogin();
  };

  const handleSignUpClick = () => {
    if (memberUid && memberName && activeTab) {
      onMemberProfileForumActivitySignUpClicked({
        memberUid,
        memberName,
        activeTab,
      });
    }
  };

  return (
    <div className={s.root}>
      {/* A plain button, not a Link to #login: the anchor navigated natively, which
          took the scroll position with it. The helper owns the navigation now. */}
      <Button style="border" className={s.signIn} onClick={handleSignInClick}>
        Sign In
      </Button>

      <div className={s.signUpContainer}>
        Don&apos;t have an account?{' '}
        <Link
          href={`${PAGE_ROUTES.SIGNUP}?returnTo=${typeof window !== 'undefined' ? window.location.pathname : ''}`}
          className={s.signUp}
          onClick={handleSignUpClick}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
