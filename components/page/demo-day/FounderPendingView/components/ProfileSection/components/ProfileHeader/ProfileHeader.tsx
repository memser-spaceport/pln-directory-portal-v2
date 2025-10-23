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
  const [visibleFoundersCount, setVisibleFoundersCount] = useState<number | null>(null); // null = measuring phase

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

      // Get the parent container width (memberDetails) instead of the empty foundersInfo
      const parentContainer = container.parentElement;
      if (!parentContainer) return;

      const containerWidth = parentContainer.offsetWidth;

      // Get gap from computed styles
      const gapWidth = 16; // Fixed gap from SCSS

      // Get divider width
      const divider = dividerRef.current;
      const dividerWidth = divider ? divider.offsetWidth : 1;

      // Get more tag width
      const moreTag = moreTagRef.current;
      const moreTagWidth = moreTag ? moreTag.offsetWidth : 50;

      let totalWidthUsed = 0;
      let count = 0;

      // Maximum 4 founders can be shown
      const maxFounders = Math.min(founders.length, 4);

      // Try to fit founders one by one, considering individual widths
      for (let i = 0; i < maxFounders; i++) {
        const founderItem = founderItemsRef.current[i];
        if (!founderItem) {
          // If item not rendered yet, stop here
          break;
        }

        const itemWidth = founderItem.offsetWidth;

        // Add divider width if this isn't the first item
        const currentDividerWidth = i > 0 ? dividerWidth : 0;
        // Add gap width if this isn't the first item
        const currentGapWidth = i > 0 ? gapWidth : 0;

        // If there are more founders after this one, reserve space for the "+X" tag
        const needsMoreTag = founders.length > i + 1;
        const moreTagSpace = needsMoreTag ? moreTagWidth + dividerWidth + gapWidth : 0;

        const widthNeeded = itemWidth + currentDividerWidth + currentGapWidth;
        const potentialTotalWidth = totalWidthUsed + widthNeeded + moreTagSpace;

        if (potentialTotalWidth <= containerWidth) {
          totalWidthUsed += widthNeeded;
          count = i + 1;
        } else {
          break;
        }
      }

      // Ensure at least 1 founder is shown if there are any
      const newCount = Math.max(1, count - 1);

      // Only update if count changed to prevent infinite loops
      if (newCount !== visibleFoundersCount) {
        setVisibleFoundersCount(newCount);
        // setIsCalculated(true);
      }
    };

    // Initial calculation - use longer timeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculateVisibleFounders();
    }, 200);

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleFounders();
    });

    resizeObserver.observe(foundersContainerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [founders, visibleFoundersCount]);

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
          <div style={{ position: 'relative' }}>
            {/* Hidden measurement container - renders ALL founders for measurement */}
            <div
              style={{
                height: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {founders.map((founder, index) => (
                <Link
                  key={`measure-${founder.uid}`}
                  href={`/members/${founder.uid}`}
                  className={s.founderItem}
                  ref={(el) => {
                    if (el) founderItemsRef.current[index] = el as any;
                  }}
                  style={{ display: 'inline-flex' }}
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
              ))}
            </div>

            {/* Visible container - only renders calculated count */}
            <div className={s.foundersInfo} ref={foundersContainerRef}>
              {visibleFoundersCount !== null &&
                founders.slice(0, visibleFoundersCount).map((founder, index) => (
                  <React.Fragment key={founder.uid}>
                    {index > 0 && <div className={s.founderDivider} />}
                    <Link
                      href={`/members/${founder.uid}`}
                      target="_blank"
                      className={s.founderItem}
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
              {visibleFoundersCount !== null && founders.length > visibleFoundersCount && (
                <>
                  <div className={s.founderDivider} />
                  <div className={s.moreFoundersTag}>+{founders.length - visibleFoundersCount}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
