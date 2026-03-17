'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetDealById } from '@/services/deals/hooks/useGetDealById';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { useToggleDealUsing } from '@/services/deals/hooks/useUserDealStatus';
import { useRedeemDeal } from '@/services/deals/hooks/useRedeemDeal';
import { useContactSupportStore } from '@/services/contact-support/store';
import { DEAL_CATEGORY_LABELS } from '@/services/deals/constants';
import { DEAL_ICONS } from '@/components/page/deals/dealsIcons';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import { toast } from '@/components/core/ToastContainer';
import s from './page.module.scss';

interface DealDetailContentProps {
  id: string;
}

export default function DealDetailContent({ id }: DealDetailContentProps) {
  const router = useRouter();
  const { hasAccess, isLoading: isAccessLoading, isError: isAccessError } = useDealsAccess();
  const { data: deal, isLoading, isError } = useGetDealById(id);
  const toggleUsingMutation = useToggleDealUsing(id);
  const redeemMutation = useRedeemDeal(id);
  const openContactSupport = useContactSupportStore((state) => state.actions.openModal);
  const [showRedemption, setShowRedemption] = useState(false);

  useEffect(() => {
    if (!isAccessLoading && !isAccessError && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isAccessLoading, isAccessError, router]);

  if (isAccessLoading || (!hasAccess && !isAccessError)) {
    return <DealDetailSkeleton />;
  }

  if (isAccessError) {
    return (
      <div className={s.root}>
        <BackButton to="/deals" />
        <div className={s.page}>
          <div className={s.notFound}>
            <h1>Unable to verify access</h1>
            <p>Please try again later.</p>
            <Link href="/deals" className={s.notFoundLink}>
              Back to Deals
            </Link>
          </div>
        </div>
      </div>
    );
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

  const IconComponent = DEAL_ICONS[deal.vendorName.toLowerCase()];

  const handleRedeem = async () => {
    setShowRedemption(true);
    try {
      await redeemMutation.mutateAsync();
    } catch {
      toast.error('Failed to redeem deal. Please try again.');
    }
  };

  const handleToggleUsing = () => {
    toggleUsingMutation.mutate(!!deal.isUsing);
  };

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
                    <span className={s.avatarPlaceholder}>{deal.vendorName.charAt(0)}</span>
                  )}
                </div>
                <div className={s.dealDetails}>
                  <div className={s.dealDescription}>
                    <h1 className={s.title}>{deal.vendorName}</h1>
                    <p className={s.description}>{deal.shortDescription}</p>
                  </div>
                  <div className={s.tags}>
                    {deal.category && (
                      <span className={`${s.tag} ${s.tagDefault}`}>
                        {DEAL_CATEGORY_LABELS[deal.category] || deal.category}
                      </span>
                    )}
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
                      <span>{deal.teamsUsingCount} using</span>
                    </div>
                  </div>
                </div>
              </div>
              {showRedemption && (
                <div className={s.headerActions}>
                  <button
                    type="button"
                    className={s.headerActionSecondary}
                    onClick={() =>
                      openContactSupport(
                        { dealId: deal.uid, dealTitle: deal.vendorName },
                        'reportBug',
                        `I'd like to report a problem with the "${deal.vendorName}" deal.`,
                      )
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3.75 10.5V3.75C3.75 3.35218 3.90804 2.97064 4.18934 2.68934C4.47064 2.40804 4.85218 2.25 5.25 2.25H14.25C14.6478 2.25 15.0294 2.40804 15.3107 2.68934C15.592 2.97064 15.75 3.35218 15.75 3.75V10.5C15.75 10.8978 15.592 11.2794 15.3107 11.5607C15.0294 11.842 14.6478 12 14.25 12H12L9.75 14.25L7.5 12H5.25C4.85218 12 4.47064 11.842 4.18934 11.5607C3.90804 11.2794 3.75 10.8978 3.75 10.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Report a Problem</span>
                  </button>
                  <button
                    type="button"
                    className={`${s.headerActionPrimary} ${deal.isUsing ? s.headerActionPrimaryActive : ''}`}
                    disabled={toggleUsingMutation.isPending}
                    onClick={handleToggleUsing}
                  >
                    {deal.isUsing ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M15 4.5L6.75 12.75L3 9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12.75 15.75V14.25C12.75 13.4544 12.4339 12.6913 11.8713 12.1287C11.3087 11.5661 10.5456 11.25 9.75 11.25H4.5C3.70435 11.25 2.94129 11.5661 2.37868 12.1287C1.81607 12.6913 1.5 13.4544 1.5 14.25V15.75"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.125 8.25C8.78185 8.25 10.125 6.90685 10.125 5.25C10.125 3.59315 8.78185 2.25 7.125 2.25C5.46815 2.25 4.125 3.59315 4.125 5.25C4.125 6.90685 5.46815 8.25 7.125 8.25Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15 6.75V11.25"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M17.25 9H12.75"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <span>{deal.isUsing ? 'Currently Using' : 'Mark as Using'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className={s.mobileDivider} />

            <div className={s.content}>
              {deal.fullDescription && (
                <div className={s.aboutSection}>
                  <h2 className={s.aboutTitle}>About the deal</h2>
                  <div className={s.aboutContent} dangerouslySetInnerHTML={{ __html: deal.fullDescription }} />
                </div>
              )}

              {showRedemption && deal.redemptionInstructions ? (
                <div className={s.redemptionInstructions}>
                  <h2 className={s.redemptionInstructionsTitle}>Redemption Instructions</h2>
                  <div
                    className={s.redemptionInstructionsBody}
                    dangerouslySetInnerHTML={{ __html: deal.redemptionInstructions }}
                  />
                </div>
              ) : (
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
                        <button
                          type="button"
                          className={s.redemptionButton}
                          disabled={redeemMutation.isPending}
                          onClick={handleRedeem}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
                          <span>{redeemMutation.isPending ? 'Redeeming...' : 'Show How to Redeem Deal'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
      <div className={s.headerContainer}>
        <div className={s.backButtonSkeleton} />
      </div>
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
