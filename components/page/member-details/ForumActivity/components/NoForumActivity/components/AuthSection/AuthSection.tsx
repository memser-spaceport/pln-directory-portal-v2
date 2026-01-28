import Link from 'next/link';

import { PAGE_ROUTES } from '@/utils/constants';

import { Button } from '@/components/common/Button';

import s from './AuthSection.module.scss';

export function AuthSection() {
  return (
    <div className={s.root}>
      <Link href="#login">
        <Button style="border" className={s.signIn}>
          Sign In
        </Button>
      </Link>

      <div className={s.signUpContainer}>
        Don’t have an account?{' '}
        <Link href={`${PAGE_ROUTES.SIGNUP}?returnTo=${window.location.pathname}`} className={s.signUp}>
          Sign Up
        </Link>
      </div>
    </div>
  );
}
