import React, { ReactNode } from 'react';
import { Metadata } from 'next';
import { BackButton } from '@/components/ui/BackButton';
import { PAGE_ROUTES } from '@/utils/constants';

import s from './layout.module.css';

export default function Layout({ contributors }: { contributors: ReactNode }) {
  return (
    <div id="contributors" className={s.contributors}>
      <BackButton to={PAGE_ROUTES.MEMBERS} />
      {contributors}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
};
