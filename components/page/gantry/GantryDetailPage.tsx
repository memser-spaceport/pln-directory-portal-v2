'use client';

import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import { GantryItemDetailContent } from './shared/GantryItemDetailContent';
import s from './GantryDetailPage.module.scss';

interface Props {
  readonly uid: string;
}

export function GantryDetailPage({ uid }: Props) {
  const router = useRouter();

  return (
    <div className={s.root}>
      <div className={s.headerContainer}>
        <BackButton to="/gantry/dashboard" className={s.backButton} />
      </div>

      <div className={s.page}>
        <div className={s.card}>
          <GantryItemDetailContent uid={uid} variant="page" onDismiss={() => router.push('/gantry/dashboard')} />
        </div>
      </div>
    </div>
  );
}
