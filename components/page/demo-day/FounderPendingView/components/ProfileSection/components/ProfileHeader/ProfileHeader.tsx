import React, { useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getSocialLinkUrl } from '@/utils/common.utils';

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
  website?: string;
  classes?: {
    name?: string;
  };
}

export const ProfileHeader = (props: ProfileHeaderProps) => {
  const { uid, image, name, description, fundingStage, tags, founders, website, classes } = props;

  const foundersContainerRef = useRef<HTMLDivElement>(null);
  const founderItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const visibleFoundersCount = 4;

  const maxFounderNameWidth = useMemo(() => {
    if (!founders || founders.length <= 2) return 260;

    const allWidth = 740;
    const minNameWidth = 80;
    const avatarWidth = 32;
    const gapBetweenItems = 8;
    const gapWithinItem = 8;
    const dividerWidth = 1;

    const effectiveFounderCount = Math.min(founders.length, 4);

    let fixedSpace = 0;

    fixedSpace += effectiveFounderCount * avatarWidth;
    fixedSpace += effectiveFounderCount * gapWithinItem;
    fixedSpace += (effectiveFounderCount - 1) * gapBetweenItems;

    if (effectiveFounderCount > 1) {
      fixedSpace += (effectiveFounderCount - 1) * dividerWidth;
    }

    if (founders.length > 4) {
      const moreTagWidth = 80;
      fixedSpace += moreTagWidth + gapBetweenItems;
    }

    const remainingSpace = allWidth - fixedSpace;
    const widthPerFounder = remainingSpace / effectiveFounderCount;

    return Math.floor(Math.max(minNameWidth, widthPerFounder));
  }, [founders]);

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
            <Link className={clsx(s.memberName, classes?.name)} href={`/teams/${uid}?backTo=/demoday`} target="_blank">
              {name}{' '}
              {uid && (
                <span className={s.externalLinkIcon}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </Link>
          </div>
          <p className={s.memberDescription}>{description}</p>
        </div>
        <div className={s.tagList}>
          {website && (
            <>
              <a
                href={getSocialLinkUrl(website, 'website')}
                target="_blank"
                rel="noopener noreferrer"
                className={s.websiteTag}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1.5 8H14.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 1.5C9.65685 3.34315 10.5 5.66667 10.5 8C10.5 10.3333 9.65685 12.6569 8 14.5C6.34315 12.6569 5.5 10.3333 5.5 8C5.5 5.66667 6.34315 3.34315 8 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {website}
              </a>
              <div className={s.tagDivider} />
            </>
          )}
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
                    <div className={s.founderName} style={{ maxWidth: `${maxFounderNameWidth}px` }}>
                      {founder.name}
                    </div>
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
                        <div className={s.founderName} style={{ maxWidth: `${maxFounderNameWidth}px` }}>
                          {founder.name}
                        </div>
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
