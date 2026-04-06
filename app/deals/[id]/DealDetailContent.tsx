'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetDealById } from '@/services/deals/hooks/useGetDealById';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { useToggleDealUsing } from '@/services/deals/hooks/useUserDealStatus';
import { useRedeemDeal } from '@/services/deals/hooks/useRedeemDeal';
import { useReportProblemModalStore } from '@/services/deals/store';
import { DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import { DEAL_ICONS } from '@/components/page/deals/dealsIcons';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import { toast } from '@/components/core/ToastContainer';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { ReportProblemModal } from '@/components/page/deals/ReportProblemModal/ReportProblemModal';
import s from './page.module.scss';
import clsx from 'clsx';

interface DealDetailContentProps {
  id: string;
}

export default function DealDetailContent({ id }: DealDetailContentProps) {
  const router = useRouter();
  const analytics = useDealsAnalytics();
  const { hasAccess, isLoading: isAccessLoading, isError: isAccessError } = useDealsAccess();
  const { data: deal, isLoading, isError } = useGetDealById(id);
  const toggleUsingMutation = useToggleDealUsing(id);
  const redeemMutation = useRedeemDeal(id);
  const openReportProblem = useReportProblemModalStore((state) => state.actions.openModal);
  const detailNotFoundLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!isAccessLoading && !isAccessError && !hasAccess) {
      analytics.trackAccessDeniedRedirect();
      router.replace('/members');
    }
  }, [hasAccess, isAccessLoading, isAccessError, router, analytics]);

  useEffect(() => {
    if (deal) {
      analytics.trackDealDetailViewed(deal.uid, deal.vendorName);
    }
  }, [deal?.uid, deal?.vendorName, analytics]);

  useEffect(() => {
    if (isAccessLoading || isAccessError || !hasAccess) return;
    if (isLoading) return;
    if (deal) return;
    if (detailNotFoundLogged.current === id) return;
    detailNotFoundLogged.current = id;
    analytics.trackDealDetailNotFound(id);
  }, [id, isAccessLoading, isAccessError, hasAccess, isLoading, deal, analytics]);

  if (isAccessLoading || (!hasAccess && !isAccessError)) {
    return <DealDetailSkeleton />;
  }

  if (isAccessError) {
    return (
      <div className={s.root}>
        <BackButton to="/deals" className={s.backButton} onNavigate={() => analytics.trackBackClicked(id, '')} />
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
        <BackButton to="/deals" className={s.backButton} onNavigate={() => analytics.trackBackClicked(id, '')} />
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
    analytics.trackRedeemClicked(deal.uid, deal.vendorName);
    try {
      await redeemMutation.mutateAsync();
      analytics.trackRedeemSucceeded(deal.uid, deal.vendorName);
    } catch {
      toast.error('Failed to redeem deal. Please try again.');
    }
  };

  const handleToggleUsing = () => {
    const nextUsing = !deal.isUsing;
    analytics.trackToggleUsingClicked(deal.uid, deal.vendorName, nextUsing);
    toggleUsingMutation.mutate(deal.isUsing, {
      onSuccess: () => {
        analytics.trackToggleUsingSucceeded(deal.uid, deal.vendorName, nextUsing);
      },
    });
  };

  return (
    <div className={s.root}>
      <div className={s.headerContainer}>
        <BackButton
          to="/deals"
          className={s.backButton}
          onNavigate={() => analytics.trackBackClicked(deal.uid, deal.vendorName)}
        />
      </div>
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.mainContent}>
            <div className={s.header}>
              <div className={s.headerContent}>
                <div className={s.avatar}>
                  {deal.logoUrl ? (
                    <img src={deal.logoUrl} alt={deal.vendorName} className={s.avatarImg} />
                  ) : IconComponent ? (
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
                    {deal.isHighValue && (
                      <span className={`${s.tag} ${s.tagHighValue}`} aria-label="High value deal">
                        ⭐
                      </span>
                    )}
                    {deal.category && (
                      <span className={`${s.tag} ${s.tagDefault}`}>
                        {DEAL_CATEGORY_LABELS[deal.category] || deal.category}
                      </span>
                    )}
                    {deal.audience && (
                      <span className={`${s.tag} ${s.tagBrand}`}>
                        {DEAL_AUDIENCE_LABELS[deal.audience] || deal.audience}
                      </span>
                    )}
                  </div>
                  <div
                    className={clsx(s.meta, {
                      [s.visible]: deal.teamsUsingCount > 0,
                    })}
                  >
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
              {deal.isRedeemed && (
                <div className={s.headerActions}>
                  <button
                    type="button"
                    className={s.headerActionSecondary}
                    onClick={() => {
                      analytics.trackReportProblemOpened(deal.uid, deal.vendorName);
                      openReportProblem(deal.uid);
                    }}
                  >
                    <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g filter="url(#filter0_d_556_4426)">
                        <path
                          d="M2.2911 2.73376C2.19926 2.81337 2.1257 2.91189 2.07546 3.02256C2.02521 3.13324 1.99948 3.25346 2.00001 3.37501V15.1875C2.00001 15.4113 2.0889 15.6259 2.24714 15.7841C2.40537 15.9424 2.61998 16.0313 2.84376 16.0313C3.06753 16.0313 3.28215 15.9424 3.44038 15.7841C3.59861 15.6259 3.68751 15.4113 3.68751 15.1875V12.2147C5.29345 11.0109 6.64766 11.5734 8.6572 12.5663C9.79837 13.1288 11.0999 13.7756 12.5103 13.7756C13.5453 13.7756 14.6394 13.4283 15.7714 12.4481C15.8625 12.3691 15.9357 12.2715 15.9859 12.1619C16.0361 12.0522 16.0622 11.9331 16.0625 11.8125V3.37501C16.0625 3.21323 16.0161 3.05485 15.9286 2.91875C15.8412 2.78264 15.7164 2.67454 15.5693 2.60734C15.4221 2.54013 15.2587 2.51665 15.0986 2.53968C14.9385 2.56272 14.7883 2.63131 14.6661 2.73727C12.9287 4.24266 11.5351 3.67313 9.40532 2.61915C7.42743 1.63618 4.96509 0.417665 2.2911 2.73376ZM14.375 11.4089C12.7691 12.6134 11.4149 12.0495 9.40532 11.0574C7.77688 10.2488 5.82009 9.28126 3.68751 10.2565V3.77509C5.29345 2.57134 6.64766 3.13384 8.6572 4.12665C9.79837 4.68915 11.0999 5.33602 12.5103 5.33602C13.1542 5.33699 13.7905 5.19758 14.375 4.92751V11.4089Z"
                          fill="#455468"
                        />
                      </g>
                      <defs>
                        <filter
                          id="filter0_d_556_4426"
                          x="-1.96875"
                          y="-1"
                          width="22"
                          height="22"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset dy="1" />
                          <feGaussianBlur stdDeviation="1" />
                          <feComposite in2="hardAlpha" operator="out" />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0"
                          />
                          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_556_4426" />
                          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_556_4426" result="shape" />
                        </filter>
                      </defs>
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
                      <svg width="24" height="19" viewBox="0 0 24 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_dd_556_4668)">
                          <path
                            d="M11.7311 11.0348C12.4378 10.4408 12.9447 9.64387 13.183 8.75201C13.4214 7.86015 13.3797 6.91656 13.0636 6.0492C12.7475 5.18185 12.1723 4.4327 11.4159 3.90336C10.6596 3.37401 9.7588 3.09009 8.83564 3.09009C7.91247 3.09009 7.01165 3.37401 6.25532 3.90336C5.499 4.4327 4.92378 5.18185 4.60767 6.0492C4.29156 6.91656 4.24986 7.86015 4.48823 8.75201C4.72659 9.64387 5.23349 10.4408 5.94017 11.0348C4.83667 11.5338 3.88037 12.3087 3.16353 13.2848C3.03112 13.4653 2.97582 13.6909 3.00977 13.9121C3.04373 14.1333 3.16416 14.3319 3.34458 14.4643C3.525 14.5967 3.75063 14.652 3.97182 14.6181C4.19302 14.5841 4.39167 14.4637 4.52407 14.2833C5.0203 13.6055 5.6693 13.0544 6.41841 12.6744C7.16753 12.2944 7.99567 12.0964 8.83564 12.0964C9.6756 12.0964 10.5037 12.2944 11.2529 12.6744C12.002 13.0544 12.651 13.6055 13.1472 14.2833C13.2796 14.4638 13.4783 14.5843 13.6995 14.6183C13.9208 14.6523 14.1465 14.5971 14.327 14.4647C14.5076 14.3323 14.6281 14.1336 14.6621 13.9123C14.6961 13.6911 14.6408 13.4653 14.5084 13.2848C13.7912 12.3088 12.8347 11.534 11.7311 11.0348ZM6.02314 7.59374C6.02314 7.03748 6.18809 6.49371 6.49713 6.0312C6.80617 5.56868 7.24542 5.2082 7.75934 4.99533C8.27326 4.78246 8.83876 4.72676 9.38433 4.83528C9.9299 4.9438 10.431 5.21167 10.8244 5.605C11.2177 5.99834 11.4856 6.49948 11.5941 7.04505C11.7026 7.59062 11.6469 8.15612 11.434 8.67004C11.2212 9.18395 10.8607 9.6232 10.3982 9.93225C9.93566 10.2413 9.3919 10.4062 8.83564 10.4062C8.08971 10.4062 7.37434 10.1099 6.8469 9.58248C6.31945 9.05503 6.02314 8.33966 6.02314 7.59374ZM20.5145 14.4612C20.4252 14.5268 20.3238 14.5742 20.2162 14.6006C20.1085 14.6271 19.9967 14.632 19.8872 14.6153C19.7776 14.5985 19.6724 14.5603 19.5776 14.5028C19.4828 14.4454 19.4003 14.3698 19.3347 14.2805C18.8372 13.604 18.188 13.0538 17.4391 12.674C16.6903 12.2942 15.8628 12.0955 15.0231 12.0937C14.7994 12.0937 14.5847 12.0048 14.4265 11.8466C14.2683 11.6884 14.1794 11.4738 14.1794 11.25C14.1794 11.0262 14.2683 10.8116 14.4265 10.6534C14.5847 10.4951 14.7994 10.4062 15.0231 10.4062C15.4372 10.4058 15.8461 10.3138 16.2206 10.137C16.5951 9.96022 16.9259 9.7029 17.1894 9.38345C17.4529 9.064 17.6427 8.6903 17.745 8.28904C17.8474 7.88778 17.8599 7.46886 17.7817 7.06221C17.7034 6.65556 17.5363 6.27121 17.2923 5.93661C17.0483 5.60201 16.7334 5.32542 16.3702 5.1266C16.0069 4.92778 15.6042 4.81163 15.1909 4.78644C14.7775 4.76126 14.3637 4.82767 13.979 4.98093C13.8759 5.02312 13.7656 5.0445 13.6542 5.04383C13.5428 5.04316 13.4327 5.02045 13.3302 4.97702C13.2276 4.93359 13.1347 4.87028 13.0568 4.79076C12.9788 4.71124 12.9174 4.61708 12.876 4.5137C12.8346 4.41032 12.8141 4.29977 12.8156 4.18842C12.8171 4.07707 12.8407 3.96713 12.8849 3.86494C12.9292 3.76274 12.9932 3.67031 13.0733 3.59298C13.1535 3.51565 13.2481 3.45494 13.3518 3.41436C14.3448 3.01678 15.447 2.98593 16.4607 3.32735C17.4745 3.66877 18.3334 4.36013 18.8836 5.27747C19.4337 6.19481 19.6391 7.27813 19.463 8.33318C19.2868 9.38824 18.7405 10.346 17.9221 11.0348C19.0256 11.5338 19.9819 12.3087 20.6988 13.2848C20.8298 13.4654 20.8841 13.6906 20.8495 13.911C20.815 14.1315 20.6946 14.3293 20.5145 14.4612Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <filter
                            id="filter0_dd_556_4668"
                            x="-0.0703125"
                            y="-2"
                            width="24"
                            height="24"
                            filterUnits="userSpaceOnUse"
                            colorInterpolationFilters="sRGB"
                          >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                              in="SourceAlpha"
                              type="matrix"
                              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                              result="hardAlpha"
                            />
                            <feOffset dy="1" />
                            <feGaussianBlur stdDeviation="1" />
                            <feColorMatrix
                              type="matrix"
                              values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0"
                            />
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_556_4668" />
                            <feColorMatrix
                              in="SourceAlpha"
                              type="matrix"
                              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                              result="hardAlpha"
                            />
                            <feOffset dy="1" />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feColorMatrix
                              type="matrix"
                              values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.12 0"
                            />
                            <feBlend
                              mode="normal"
                              in2="effect1_dropShadow_556_4668"
                              result="effect2_dropShadow_556_4668"
                            />
                            <feBlend
                              mode="normal"
                              in="SourceGraphic"
                              in2="effect2_dropShadow_556_4668"
                              result="shape"
                            />
                          </filter>
                        </defs>
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

              {deal.isRedeemed && deal.redemptionInstructions ? (
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
      <ReportProblemModal />
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
