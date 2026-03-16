'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetDealById } from '@/services/deals/hooks/useGetDealById';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import { DEAL_ICONS } from '@/components/page/deals/dealsIcons';
import { BackButton } from '@/components/ui/BackButton/BackButton';
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
    return <DealDetailSkeleton />;
  }

  if (isLoading) {
    return <DealDetailSkeleton />;
  }

  if (isError || !deal) {
    return (
      <div className={s.root}>
        <BackButton to="/deals" />
        <div className={s.page}>
          <div className={s.notFound}>
            <h1>Deal not found</h1>
            <Link href="/deals" className={s.notFoundLink}>
              Back to Deals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = DEAL_ICONS[deal.title.toLowerCase()];

  return (
    <div className={s.root}>
      <div className={s.headerContainer}>
        <BackButton to="/deals" />
      </div>
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.mainContent}>
            <div className={s.header}>
              <div className={s.headerContent}>
                <div className={s.avatar}>
                  {IconComponent ? (
                    <IconComponent />
                  ) : (
                    <span className={s.avatarPlaceholder}>{deal.title.charAt(0)}</span>
                  )}
                </div>
                <div className={s.dealDetails}>
                  <div className={s.dealDescription}>
                    <h1 className={s.title}>{deal.title}</h1>
                    <p className={s.description}>{deal.description}</p>
                  </div>
                  <div className={s.tags}>
                    {deal.categories.map((cat) => (
                      <span key={cat} className={`${s.tag} ${s.tagDefault}`}>
                        {DEAL_CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                    {deal.audience.map((aud) => (
                      <span
                        key={aud}
                        className={`${s.tag} ${aud === 'pl-funded-founders' ? s.tagBrand : s.tagDefault}`}
                      >
                        {DEAL_AUDIENCE_LABELS[aud] || aud}
                      </span>
                    ))}
                  </div>
                  <div className={s.meta}>
                    <div className={s.metaItem}>
                      <svg className={s.metaIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13 14C13 11.2386 10.7614 9 8 9C5.23858 9 3 11.2386 3 14"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{deal.usersCount} using</span>
                    </div>
                    <span className={s.metaDot} />
                    <div className={s.metaItem}>
                      {deal.issuesCount === 0 ? (
                        <>
                          <svg
                            className={s.metaIcon}
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5.5 8L7 9.5L10.5 6"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>No issues</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className={s.metaIcon}
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path d="M8 5.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            <circle cx="8" cy="10.5" r="0.5" fill="currentColor" />
                          </svg>
                          <span>
                            {deal.issuesCount} {deal.issuesCount === 1 ? 'Issue' : 'Issues'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={s.content}>
              {deal.aboutHtml && (
                <div className={s.aboutSection}>
                  <h2 className={s.aboutTitle}>About the deal</h2>
                  <div className={s.aboutContent} dangerouslySetInnerHTML={{ __html: deal.aboutHtml }} />
                </div>
              )}

              <div className={s.redemptionCard}>
                <div className={s.redemptionInner}>
                  <div className={s.redemptionEmpty}>
                    <div className={s.redemptionIcon}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M22 4H10C8.89543 4 8 4.89543 8 6V28L12 25L16 28L20 25L24 28V6C24 4.89543 23.1046 4 22 4Z"
                          stroke="#1b4dff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 12H20"
                          stroke="#1b4dff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 17H20"
                          stroke="#1b4dff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className={s.redemptionContent}>
                      <div className={s.redemptionText}>
                        <h2 className={s.redemptionTitle}>Redemption Instructions</h2>
                      </div>
                      <button type="button" className={s.redemptionButton}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10 4.16667V15.8333"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            transform="rotate(90 10 10)"
                          />
                          <path
                            d="M1.25 10C1.25 10 4.5 4.16667 10 4.16667C15.5 4.16667 18.75 10 18.75 10C18.75 10 15.5 15.8333 10 15.8333C4.5 15.8333 1.25 10 1.25 10Z"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Show How to Redeem Deal</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealDetailSkeleton() {
  return (
    <div className={s.root}>
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.mainContent}>
            <div className={s.header}>
              <div className={s.headerContent}>
                <div className={`${s.avatar} ${s.skeleton}`} />
                <div className={s.dealDetails}>
                  <div className={s.skeletonBlock} style={{ width: '200px', height: '42px' }} />
                  <div className={s.skeletonBlock} style={{ width: '300px', height: '22px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div
                      className={s.skeletonBlock}
                      style={{ width: '140px', height: '24px', borderRadius: '9999px' }}
                    />
                    <div
                      className={s.skeletonBlock}
                      style={{ width: '100px', height: '24px', borderRadius: '9999px' }}
                    />
                  </div>
                  <div className={s.skeletonBlock} style={{ width: '180px', height: '18px' }} />
                </div>
              </div>
            </div>
            <div className={s.content}>
              <div className={s.aboutSection}>
                <div className={s.skeletonBlock} style={{ width: '200px', height: '34px' }} />
                <div className={s.skeletonBlock} style={{ width: '100%', height: '24px' }} />
                <div className={s.skeletonBlock} style={{ width: '90%', height: '24px' }} />
                <div className={s.skeletonBlock} style={{ width: '160px', height: '27px', marginTop: '12px' }} />
                <div className={s.skeletonBlock} style={{ width: '100%', height: '24px' }} />
                <div className={s.skeletonBlock} style={{ width: '80%', height: '24px' }} />
              </div>
              <div className={s.skeletonBlock} style={{ width: '100%', height: '224px', borderRadius: '12px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
