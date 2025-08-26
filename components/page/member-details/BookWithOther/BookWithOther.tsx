import React from 'react';

import s from './BookWithOther.module.scss';
import Link from 'next/link';
import { IMember } from '@/types/members.types';

interface Props {
  count: number;
  member: IMember;
}

export const BookWithOther = ({ count, member }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.header}>{member.name} doesn&apos;t have their schedule available right now</div>
      <div className={s.body}>You can book office hours with other members who are available.</div>
      <Link className={s.button} href="/members?hasOfficeHours=true">
        See {count} members open to connect
      </Link>
    </div>
  );
};
