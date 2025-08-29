'use client';

import React from 'react';

import s from './BookWithOther.module.scss';
import Link from 'next/link';
import { IMember } from '@/types/members.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';

interface Props {
  count: number;
  member: IMember;
}

export const BookWithOther = ({ count, member }: Props) => {
  const { onClickBookWithOther } = useMemberAnalytics();

  return (
    <div className={s.root}>
      <div className={s.header}>{member.name} doesn&apos;t have their schedule available right now</div>
      <div className={s.body}>You can book office hours with other members who are available.</div>
      <Link className={s.button} href="/members?hasOfficeHours=true" onClick={() => onClickBookWithOther({ selectedMemberId: member.id })}>
        See {count} members open to connect
      </Link>
    </div>
  );
};
