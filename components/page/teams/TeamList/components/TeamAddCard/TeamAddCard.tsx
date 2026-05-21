'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './TeamAddCard.module.scss';

export const TeamAddCard = (props: any) => {
  const viewType = props?.viewType;
  const analytics = useCommonAnalytics();
  const router = useRouter();

  const onAddClick = () => {
    analytics.onSubmitATeamBtnClicked();
    router.push(PAGE_ROUTES.ADD_TEAM);
  };

  const isList = viewType === VIEW_TYPE_OPTIONS.LIST;

  return (
    <div className={isList ? s.div : undefined}>
      <Link href={PAGE_ROUTES.ADD_TEAM} prefetch={false} onClick={onAddClick} className={`${s.card} ${isList ? s.cardList : ''}`}>
        <img src="/icons/add.svg" alt="add" />
        <p className={s.add}>Add Team</p>
        <p className={s.text}>List your team here</p>
      </Link>
    </div>
  );
};
