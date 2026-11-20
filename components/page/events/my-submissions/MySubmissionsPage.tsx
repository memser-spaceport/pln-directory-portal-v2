'use client';

import clsx from 'clsx';
import Link from 'next/link';

import btn from '@/components/common/Button/Button.module.scss';
import { BackButton } from '@/components/ui/BackButton';
import { EVENTS_LIST_PATH } from '@/utils/constants';
import { EVENTS_SUBMIT_PATH } from '@/utils/events-submit';

import { MySubmissionsList } from './MySubmissionsList';
import { MySubmissionsSignIn } from './MySubmissionsSignIn';
import s from './MySubmissionsPage.module.scss';

interface Props {
  signedIn: boolean;
  /** A directory admin can also delete an approved event. */
  isAdmin: boolean;
}

/** `/events/mine`: the header, then the member's events, or the sign-in state for a signed-out visitor. */
export function MySubmissionsPage({ signedIn, isAdmin }: Props) {
  return (
    <div className={s.page}>
      <div className={s.container}>
        <BackButton to={EVENTS_LIST_PATH} forceTo className={s.back} />
        <header className={s.header}>
          <h1 className={s.title}>My Submissions</h1>
          <Link href={EVENTS_SUBMIT_PATH} className={clsx(btn.root, btn.small, btn.fill, btn.primary, s.submit)}>
            Submit an event
          </Link>
        </header>
        {signedIn ? <MySubmissionsList isAdmin={isAdmin} /> : <MySubmissionsSignIn />}
      </div>
    </div>
  );
}
