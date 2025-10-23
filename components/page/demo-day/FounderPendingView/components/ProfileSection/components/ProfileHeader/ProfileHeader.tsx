import React, { useMemo, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './ProfileHeader.module.scss';

interface Founder {
  uid: string;
  name: string;
  role: string;
  image: { url: string } | null;
}

interface ProfileHeaderProps {
  uid?: string;
  image?: string;
  name: string;
  description: string;
  fundingStage?: string;
  tags: string[];
  founders?: Founder[];
  classes?: {
    name?: string;
  };
}

export const ProfileHeader = (props: ProfileHeaderProps) => {
  const { uid, image, name, description, fundingStage, tags, founders, classes } = props;

  const foundersContainerRef = useRef<HTMLDivElement>(null);
  const founderItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const dividerRef = useRef<HTMLDivElement>(null);
  const moreTagRef = useRef<HTMLDivElement>(null);
  const [visibleFoundersCount, setVisibleFoundersCount] = useState(4);

  // Helper function to format funding stage
  const formatFundingStage = (stage: string) => {
    const stageMap: Record<string, string> = {
      'pre-seed': 'Pre-Seed',
      seed: 'Seed',
      'series-a': 'Series A',
      'series-b': 'Series B',
      'series-c': 'Series C',
      growth: 'Growth',
      ipo: 'IPO',
    };
    return stageMap[stage] || stage;
  };

  // Helper function to render tags with overflow handling
  const renderTags = (tags: string[]) => {
    const maxVisibleTags = 4;
    const visibleTags = tags.slice(0, maxVisibleTags);
    const remainingCount = tags.length - maxVisibleTags;

    return (
      <>
        {visibleTags.map((tag, index) => (
          <div key={index} className={s.tag}>
            {tag}
          </div>
        ))}
        {remainingCount > 0 && <div className={s.tag}>+{remainingCount}</div>}
      </>
    );
  };

  // Calculate how many founders can fit in the available space
  useEffect(() => {
    if (!foundersContainerRef.current || !founders || founders.length === 0) return;

    const calculateVisibleFounders = () => {
      const container = foundersContainerRef.current;
      if (!container) return;

      // Get actual measured dimensions from rendered elements
      const firstFounderItem = founderItemsRef.current[0];
      const divider = dividerRef.current;
      const moreTag = moreTagRef.current;

      if (!firstFounderItem) return;

      const containerWidth = container.offsetWidth;

      // Measure actual widths from DOM elements
      const founderItemWidth = firstFounderItem.offsetWidth;
      const dividerWidth = divider ? divider.offsetWidth : 0;
      const moreTagWidth = moreTag ? moreTag.offsetWidth : 0;

      // Get gap from computed styles
      const containerStyles = window.getComputedStyle(container);
      const gapWidth = parseFloat(containerStyles.gap) || 16;

      let count = 0;

      // Try to fit founders one by one
      for (let i = 1; i <= Math.min(founders.length, 4); i++) {
        const itemsWidth = i * founderItemWidth;
        const dividersWidth = (i - 1) * dividerWidth;
        const gapsWidth = (i - 1) * gapWidth;

        // If there are more founders, reserve space for the "+X" tag
        const needsMoreTag = founders.length > i;
        const moreTagSpace = needsMoreTag ? moreTagWidth + dividerWidth + gapWidth : 0;

        const totalWidth = itemsWidth + dividersWidth + gapsWidth + moreTagSpace;

        if (totalWidth <= containerWidth) {
          count = i;
        } else {
          break;
        }
      }

      // Ensure at least 1 founder is shown if there are any
      setVisibleFoundersCount(Math.max(1, count));
    };

    // Wait for initial render to complete before measuring
    const timeoutId = setTimeout(() => {
      calculateVisibleFounders();
    }, 0);

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleFounders();
    });

    resizeObserver.observe(foundersContainerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [founders]);

  return (
    <div className={s.profileHeader}>
      <div
        className={s.profileImage}
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!image && <div className={s.profileImagePlaceholder} />}
      </div>
      <div className={s.memberDetails}>
        <div className={s.memberInfo}>
          <div className={s.memberNameContainer}>
            <h2 className={clsx(s.memberName, classes?.name)}>
              {name}{' '}
              {uid && (
                <Link className={s.externalLinkIcon} href={`/teams/${uid}`} target="_blank">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </h2>
          </div>
          <p className={s.memberDescription}>{description}</p>
        </div>
        <div className={s.tagList}>
          <div className={s.stageTag}>Stage: {fundingStage ? formatFundingStage(fundingStage) : 'Not specified'}</div>
          {tags && tags.length > 0 && (
            <>
              <div className={s.tagDivider} />
              {renderTags(tags)}
            </>
          )}
        </div>

        {/* Founders Info */}
        {founders && founders.length > 0 && (
          <div className={s.foundersInfo} ref={foundersContainerRef}>
            {founders.slice(0, visibleFoundersCount).map((founder, index) => (
              <React.Fragment key={founder.uid}>
                {index > 0 && <div className={s.founderDivider} ref={index === 1 ? dividerRef : null} />}
                <Link
                  href={`/members/${founder.uid}`}
                  target="_blank"
                  className={s.founderItem}
                  ref={(el) => {
                    founderItemsRef.current[index] = el;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div
                    className={s.founderAvatar}
                    style={{
                      backgroundImage: founder.image?.url
                        ? `url('${founder.image.url}')`
                        : `url('${getDefaultAvatar(founder.name)}')`,
                    }}
                  />
                  <div className={s.founderText}>
                    <div className={s.founderName}>{founder.name}</div>
                    <div className={s.founderRole}>{founder.role || 'Co-Founder'}</div>
                  </div>
                </Link>
              </React.Fragment>
            ))}
            {founders.length > visibleFoundersCount && (
              <>
                <div className={s.founderDivider} />
                <div className={s.moreFoundersTag} ref={moreTagRef}>
                  +{founders.length - visibleFoundersCount}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
