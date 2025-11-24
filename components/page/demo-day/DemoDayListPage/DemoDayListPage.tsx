'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { Button } from '@/components/common/Button';
import { DemoDayCard } from '@/components/common/DemoDayCard';
import { ApplyForDemoDayModal } from '@/components/page/demo-day/ApplyForDemoDayModal';

import s from './DemoDayListPage.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { faqCompletedItems } from '@/app/constants/demoday';

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

type Props = {
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
  memberData?: IMember | null;
};

export const DemoDayListPage = ({ isLoggedIn, userInfo, memberData }: Props) => {
  const { data: demoDays, isLoading } = useGetDemoDaysList();
  const [showAll, setShowAll] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

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
              <Button
                size="l"
                style="fill"
                variant="primary"
                className={s.applyButton}
                onClick={() => setIsApplyModalOpen(true)}
              >
                Apply for Founders Forge <ArrowRight />
              </Button>
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
                displayedDemoDays.map((demoDay) => (
                  <DemoDayCard
                    key={demoDay.slugURL}
                    slug={demoDay.slugURL}
                    title={demoDay.title}
                    description={demoDay.description}
                    date={demoDay.date}
                    status={demoDay.status}
                  />
                ))
              ) : (
                <div className={s.empty}>No demo days available</div>
              )}
            </div>

            {demoDays && demoDays.length > 3 && (
              <Button
                size="m"
                style="border"
                variant="secondary"
                onClick={() => setShowAll(!showAll)}
                className={s.showMoreButton}
              >
                {showAll ? 'Show Less' : 'Show All'}
              </Button>
            )}
          </div>
        </section>

        {/* Partners Section */}
        <section className={s.sectionPartners}>
          <div className={s.logosButtonContainer}>
            <LogosGrid source="completed" />
          </div>
        </section>

        {/* FAQ Section */}
        <section className={s.sectionFaq}>
          <FAQ
            title="Frequently Asked Questions"
            items={faqCompletedItems}
            subtitle={
              <div className={s.infoText}>
                Reach out to us on{' '}
                <a href="mailto:demoday@protocol.ai" className={s.infoLink}>
                  demoday@protocol.ai
                </a>{' '}
                for any other questions.
              </div>
            }
          />
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.bottom}>
            <p className={s.labelText}>
              © 2025 Protocol Labs. All content is provided by the founders. Protocol Labs Demo Day organizers do not
              endorse or recommend any investment.
            </p>
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

      <ApplyForDemoDayModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        userInfo={userInfo}
        memberData={memberData}
      />
    </div>
  );
};
