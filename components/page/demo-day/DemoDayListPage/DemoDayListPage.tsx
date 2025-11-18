'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { Button } from '@/components/common/Button';
import { APPLY_FOR_NEXT_DEMO_DAY_URL } from '@/constants/demoDay';

import s from './DemoDayListPage.module.scss';
import { IUserInfo } from '@/types/shared.types';

const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.16669 10H15.8334M15.8334 10L10 4.16669M15.8334 10L10 15.8334"
      stroke="currentColor"
      strokeWidth="1.67"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5858 3.85775L10.1423 1.41377C10.0408 1.31216 9.92018 1.23155 9.78746 1.17656C9.65473 1.12157 9.51246 1.09326 9.36879 1.09326C9.22512 1.09326 9.08286 1.12157 8.95013 1.17656C8.8174 1.23155 8.69681 1.31216 8.59524 1.41377L1.85172 8.15783C1.74979 8.2591 1.66897 8.3796 1.61396 8.51234C1.55895 8.64508 1.53084 8.78742 1.53125 8.93111V11.3751C1.53125 11.6652 1.64649 11.9434 1.85161 12.1485C2.05672 12.3536 2.33492 12.4688 2.625 12.4688H5.06899C5.21267 12.4692 5.35501 12.4411 5.48774 12.3861C5.62048 12.3311 5.74098 12.2503 5.84227 12.1484L12.5858 5.40432C12.7908 5.19921 12.906 4.92106 12.906 4.63104C12.906 4.34101 12.7908 4.06286 12.5858 3.85775ZM4.97657 11.1563H2.84375V9.02354L7.4375 4.42979L9.57032 6.5626L4.97657 11.1563ZM10.5 5.63291L8.36719 3.5001L9.37016 2.49713L11.503 4.62994L10.5 5.63291Z"
      fill="#1B4DFF"
    />
  </svg>
);

const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case 'UPCOMING':
      return { label: 'Upcoming', className: s.badgeUpcoming };
    case 'ACTIVE':
      return { label: 'Active', className: s.badgeActive };
    case 'COMPLETED':
      return { label: 'Completed', className: s.badgeCompleted };
    case 'ARCHIVED':
      return { label: 'Archived', className: s.badgeArchived };
    default:
      return { label: status, className: s.badgeDefault };
  }
};

type Props = {
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
};

export const DemoDayListPage = ({ isLoggedIn, userInfo }: Props) => {
  const { data: demoDays, isLoading } = useGetDemoDaysList();
  const [showAll, setShowAll] = useState(false);

  const displayedDemoDays = showAll ? demoDays : demoDays?.slice(0, 3);

  return (
    <div className={s.root}>
      <div className={s.content}>
        {/* Hero Section */}
        <section className={s.heroSection}>
          <div className={s.section1}>
            <div className={s.title}>
              <div className={s.overline}>
                <div className={s.dot} />
                <span className={s.overlineText}>UPCOMING DEMO DAY</span>
                <span className={s.break}>•</span>
                <span className={s.overlineText}>DEC 10, 2025</span>
              </div>
              <div className={s.headline}>
                <h1 className={s.headlineTitle}>PL Demo Day</h1>
                <p className={s.headlineBody}>
                  PL Demo Day is a concentrated virtual event featuring the most promising, pre-selected batch of
                  high-quality teams that will deliver pitches, in a fully asynchronous environment.
                </p>
              </div>
            </div>
            <div className={s.buttons}>
              <Link href={APPLY_FOR_NEXT_DEMO_DAY_URL} target="_blank" rel="noopener noreferrer">
                <Button size="l" style="fill" variant="primary" className={s.applyButton}>
                  Apply for Founders Forge <ArrowRight />
                </Button>
              </Link>
              <div className={s.links}>
                {isLoggedIn && userInfo && (
                  <Link target="_blank" href={`/members/${userInfo?.uid}?backTo=/demoday`} className={s.linkButton}>
                    Keep your profile updated <EditIcon />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Cards Section */}
          <div className={s.section2}>
            <div className={s.cards}>
              {isLoading ? (
                <div className={s.loading}>Loading demo days...</div>
              ) : displayedDemoDays && displayedDemoDays.length > 0 ? (
                displayedDemoDays.map((demoDay) => {
                  const badgeProps = getStatusBadgeProps(demoDay.status);
                  const formattedDate = format(new Date(demoDay.date), 'MMMM d, yyyy');

                  return (
                    <Link href={`/demoday/${demoDay.uid}`} key={demoDay.uid} className={s.card}>
                      <div className={s.cardContent}>
                        <div className={s.eventInfo}>
                          <div className={s.cardOverline}>
                            <span className={`${s.badge} ${badgeProps.className}`}>{badgeProps.label}</span>
                            <span className={s.date}>{formattedDate}</span>
                          </div>
                          <h3 className={s.cardTitle}>{demoDay.title}</h3>
                          <p className={s.cardDescription}>{demoDay.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className={s.empty}>No demo days available</div>
              )}
            </div>

            {demoDays && demoDays.length > 3 && (
              <Button size="m" variant="secondary" onClick={() => setShowAll(!showAll)} className={s.showMoreButton}>
                {showAll ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
        </section>

        {/* Partners Section */}
        <section className={s.partnersSection}>
          <div className={s.subtitle}>
            <p className={s.label}>Backed by leading investors and industry pioneers</p>
          </div>
          <div className={s.logosAndButton}>
            <div className={s.logos}>
              <div className={s.logoText}>a16z crypto</div>
              <div className={s.logoText}>Coinbase Ventures</div>
              <div className={s.logoText}>HashKey Capital</div>
              <div className={s.logoText}>Polychain</div>
              <div className={s.logoText}>Multicoin Capital</div>
              <div className={s.logoText}>Union Square Ventures</div>
              <div className={s.logoText}>Pantera Capital</div>
              <div className={s.logoText}>Digital Currency Group</div>
              <div className={s.logoText}>Protocol Labs</div>
              <div className={s.logoText}>Juan Benet</div>
              <div className={s.logoText}>Balaji Srinivasan</div>
              <div className={s.logoText}>Vitalik Buterin</div>
              <div className={s.logoText}>Anatoly Yakovenko</div>
            </div>
            <Link href="/members?hasOfficeHours=true" className={s.partnersLink}>
              <Button size="m" variant="secondary">
                View All
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.bottom}>
            <p className={s.labelText}>© 2025 Protocol Labs. All rights reserved.</p>
            <div className={s.footerButtons}>
              <Link href="/privacy" className={s.footerLink}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={s.footerLink}>
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
