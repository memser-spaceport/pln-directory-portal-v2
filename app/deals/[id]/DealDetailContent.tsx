'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetDealById } from '@/services/deals/hooks/useGetDealById';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import s from './page.module.scss';

interface DealDetailContentProps {
  id: string;
}

export default function DealDetailContent({ id }: DealDetailContentProps) {
  const router = useRouter();
  const { hasAccess, isLoading: isAccessLoading } = useDealsAccess();
  const { data: deal, isLoading, isError } = useGetDealById(id);

  useEffect(() => {
    if (!isAccessLoading && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isAccessLoading, router]);

  if (isAccessLoading || !hasAccess) {
    return (
      <div className={s.root}>
        <div className={s.skeleton} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={s.root}>
        <div className={s.skeleton} />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className={s.root}>
        <div className={s.notFound}>
          <h1>Deal not found</h1>
          <Link href="/deals" className={s.backLink}>
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <Link href="/deals" className={s.backLink}>
        &larr; Back to Deals
      </Link>
      <div className={s.card}>
        <div className={s.header}>
          <div className={s.avatar}>
            <span className={s.avatarPlaceholder}>{deal.title.charAt(0)}</span>
          </div>
          <div>
            <h1 className={s.title}>{deal.title}</h1>
            <p className={s.description}>{deal.description}</p>
          </div>
        </div>
        <div className={s.tags}>
          {deal.categories.map((cat) => (
            <span key={cat} className={s.tag}>
              {DEAL_CATEGORY_LABELS[cat] || cat}
            </span>
          ))}
          {deal.audience.map((aud) => (
            <span key={aud} className={`${s.tag} ${aud === 'pl-funded-founders' ? s.tagBrand : ''}`}>
              {DEAL_AUDIENCE_LABELS[aud] || aud}
            </span>
          ))}
        </div>
        <div className={s.meta}>
          <span>{deal.usersCount} teams using this deal</span>
          <span>&middot;</span>
          <span>{deal.issuesCount === 0 ? 'No issues reported' : `${deal.issuesCount} issue(s) reported`}</span>
        </div>
        <a href={deal.externalUrl} target="_blank" rel="noopener noreferrer" className={s.ctaButton}>
          Visit {deal.title} &rarr;
        </a>
      </div>
    </div>
  );
}
