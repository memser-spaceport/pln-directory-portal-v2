import React, { useRef, useEffect } from 'react';

import s from './SearchCategories.module.scss';
import { SearchResult } from '@/services/search/types';
import { clsx } from 'clsx';

interface Props {
  data: SearchResult | undefined;
  activeCategory: keyof SearchResult | null;
  setActiveCategory: (category: keyof SearchResult | null) => void;
  mode?: 'regular' | 'ai';
  onToggleMode?: (mode: 'regular' | 'ai') => void;
}

export const SearchCategories = ({ data, activeCategory, setActiveCategory, mode, onToggleMode }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const aiBadgeRef = useRef<HTMLDivElement>(null);

  // Scroll selected badge into view when activeCategory or mode changes
  useEffect(() => {
    if (!containerRef.current) return;

    let targetElement: HTMLDivElement | null = null;

    // Determine which element should be scrolled into view
    if (mode === 'ai' && aiBadgeRef.current) {
      targetElement = aiBadgeRef.current;
    } else if (activeCategory && badgeRefs.current[activeCategory]) {
      targetElement = badgeRefs.current[activeCategory];
    }

    if (targetElement) {
      const containerElement = containerRef.current;

      // Check if badge is outside the visible area
      const badgeRect = targetElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();

      const isOutsideLeft = badgeRect.left < containerRect.left;
      const isOutsideRight = badgeRect.right > containerRect.right;

      if (isOutsideLeft || isOutsideRight) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeCategory, mode]);

  function renderCategoryBadge(category: keyof SearchResult, label: string) {
    return (
      <div
        ref={(el) => {
          badgeRefs.current[category] = el;
        }}
        className={clsx(s.categoryBadge, {
          [s.active]: activeCategory === category,
        })}
        onClick={() => {
          setActiveCategory(category === activeCategory ? null : category);

          onToggleMode?.('regular');
        }}
      >
        {label} {data?.[category]?.length ?? 0}
      </div>
    );
  }

  return (
    <div className={s.root} ref={containerRef}>
      {!!mode && (
        <>
          <div
            ref={aiBadgeRef}
            className={clsx(s.categoryBadge, s.aiBadge, {
              [s.active]: mode === 'ai',
            })}
            onClick={() => {
              onToggleMode?.(mode === 'ai' ? 'regular' : 'ai');
              setActiveCategory(null);
            }}
          >
            {mode === 'ai' ? <SearchIcon /> : <SearchIconColor />} AI
          </div>
          <div className={s.divider} />
        </>
      )}
      {renderCategoryBadge('top', 'Top')}
      {renderCategoryBadge('members', 'Members')}
      {renderCategoryBadge('teams', 'Teams')}
      {renderCategoryBadge('projects', 'Projects')}
      {renderCategoryBadge('forumThreads', 'Forum')}
      {renderCategoryBadge('events', 'Events')}
    </div>
  );
};

const SearchIconColor = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.475 6.09091C9.83399 6.09091 10.125 6.37582 10.125 6.72727V7.68182H11.1C11.459 7.68182 11.75 7.96673 11.75 8.31818C11.75 8.66964 11.459 8.95455 11.1 8.95455H10.125V9.90909C10.125 10.2605 9.83399 10.5455 9.475 10.5455C9.11602 10.5455 8.825 10.2605 8.825 9.90909V8.95455H7.85C7.49102 8.95455 7.2 8.66964 7.2 8.31818C7.2 7.96673 7.49102 7.68182 7.85 7.68182H8.825V6.72727C8.825 6.37582 9.11602 6.09091 9.475 6.09091Z"
      fill="url(#paint0_linear_4516_36760)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.575 1C5.85478 1 6.10317 1.17527 6.19165 1.43513L6.82012 3.281L8.70555 3.89629C8.97097 3.98291 9.15 4.22609 9.15 4.5C9.15 4.77391 8.97097 5.01709 8.70555 5.10371L6.82012 5.719L6.19165 7.56487C6.10317 7.82473 5.85478 8 5.575 8C5.29522 8 5.04683 7.82473 4.95836 7.56487L4.32988 5.719L2.44445 5.10371C2.17903 5.01709 2 4.77391 2 4.5C2 4.22609 2.17903 3.98291 2.44445 3.89629L4.32988 3.281L4.95836 1.43513C5.04683 1.17527 5.29522 1 5.575 1ZM5.575 3.64872L5.4604 3.98533C5.3957 4.17535 5.24339 4.32446 5.0493 4.3878L4.70548 4.5L5.0493 4.6122C5.24339 4.67554 5.3957 4.82465 5.4604 5.01467L5.575 5.35128L5.68961 5.01467C5.75431 4.82465 5.90661 4.67554 6.1007 4.6122L6.44452 4.5L6.1007 4.3878C5.90661 4.32446 5.75431 4.17535 5.68961 3.98533L5.575 3.64872Z"
      fill="url(#paint1_linear_4516_36760)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.35962 11.3682C6.61346 11.6167 6.61346 12.0196 6.35962 12.2682L3.75962 14.8136C3.50578 15.0621 3.09422 15.0621 2.84038 14.8136C2.58654 14.5651 2.58654 14.1622 2.84038 13.9137L5.44038 11.3682C5.69422 11.1197 6.10578 11.1197 6.35962 11.3682Z"
      fill="url(#paint2_linear_4516_36760)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.81299 3.51433C9.88441 3.1699 10.2275 2.94736 10.5793 3.01728C13.1015 3.51851 15 5.70057 15 8.31818C15 11.3055 12.5264 13.7273 9.475 13.7273C7.06836 13.7273 5.0227 12.2212 4.26455 10.1212C4.14492 9.78979 4.32232 9.42622 4.66078 9.3091C4.99925 9.19198 5.37061 9.36566 5.49024 9.69703C6.07055 11.3044 7.63642 12.4545 9.475 12.4545C11.8084 12.4545 13.7 10.6026 13.7 8.31818C13.7 6.31778 12.2489 4.64777 10.3207 4.26457C9.96888 4.19465 9.74158 3.85876 9.81299 3.51433Z"
      fill="url(#paint3_linear_4516_36760)"
    />
    <defs>
      <linearGradient id="paint0_linear_4516_36760" x1="15" y1="15" x2="0.591867" y2="11.3041" gradientUnits="userSpaceOnUse">
        <stop stopColor="#45D8FF" />
        <stop offset="0.891573" stopColor="#005BEA" />
      </linearGradient>
      <linearGradient id="paint1_linear_4516_36760" x1="15" y1="15" x2="0.591867" y2="11.3041" gradientUnits="userSpaceOnUse">
        <stop stopColor="#45D8FF" />
        <stop offset="0.891573" stopColor="#005BEA" />
      </linearGradient>
      <linearGradient id="paint2_linear_4516_36760" x1="15" y1="15" x2="0.591867" y2="11.3041" gradientUnits="userSpaceOnUse">
        <stop stopColor="#45D8FF" />
        <stop offset="0.891573" stopColor="#005BEA" />
      </linearGradient>
      <linearGradient id="paint3_linear_4516_36760" x1="15" y1="15" x2="0.591867" y2="11.3041" gradientUnits="userSpaceOnUse">
        <stop stopColor="#45D8FF" />
        <stop offset="0.891573" stopColor="#005BEA" />
      </linearGradient>
    </defs>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.475 6.09091C9.83399 6.09091 10.125 6.37582 10.125 6.72727V7.68182H11.1C11.459 7.68182 11.75 7.96673 11.75 8.31818C11.75 8.66964 11.459 8.95455 11.1 8.95455H10.125V9.90909C10.125 10.2605 9.83399 10.5455 9.475 10.5455C9.11602 10.5455 8.825 10.2605 8.825 9.90909V8.95455H7.85C7.49102 8.95455 7.2 8.66964 7.2 8.31818C7.2 7.96673 7.49102 7.68182 7.85 7.68182H8.825V6.72727C8.825 6.37582 9.11602 6.09091 9.475 6.09091Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.575 1C5.85478 1 6.10317 1.17527 6.19165 1.43513L6.82012 3.281L8.70555 3.89629C8.97097 3.98291 9.15 4.22609 9.15 4.5C9.15 4.77391 8.97097 5.01709 8.70555 5.10371L6.82012 5.719L6.19165 7.56487C6.10317 7.82473 5.85478 8 5.575 8C5.29522 8 5.04683 7.82473 4.95836 7.56487L4.32988 5.719L2.44445 5.10371C2.17903 5.01709 2 4.77391 2 4.5C2 4.22609 2.17903 3.98291 2.44445 3.89629L4.32988 3.281L4.95836 1.43513C5.04683 1.17527 5.29522 1 5.575 1ZM5.575 3.64872L5.4604 3.98533C5.3957 4.17535 5.24339 4.32446 5.0493 4.3878L4.70548 4.5L5.0493 4.6122C5.24339 4.67554 5.3957 4.82465 5.4604 5.01467L5.575 5.35128L5.68961 5.01467C5.75431 4.82465 5.90661 4.67554 6.1007 4.6122L6.44452 4.5L6.1007 4.3878C5.90661 4.32446 5.75431 4.17535 5.68961 3.98533L5.575 3.64872Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.35962 11.3682C6.61346 11.6167 6.61346 12.0196 6.35962 12.2682L3.75962 14.8136C3.50578 15.0621 3.09422 15.0621 2.84038 14.8136C2.58654 14.5651 2.58654 14.1622 2.84038 13.9137L5.44038 11.3682C5.69422 11.1197 6.10578 11.1197 6.35962 11.3682Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.81299 3.51433C9.88441 3.1699 10.2275 2.94736 10.5793 3.01728C13.1015 3.51851 15 5.70057 15 8.31818C15 11.3055 12.5264 13.7273 9.475 13.7273C7.06836 13.7273 5.0227 12.2212 4.26455 10.1212C4.14492 9.78979 4.32232 9.42622 4.66078 9.3091C4.99925 9.19198 5.37061 9.36566 5.49024 9.69703C6.07055 11.3044 7.63642 12.4545 9.475 12.4545C11.8084 12.4545 13.7 10.6026 13.7 8.31818C13.7 6.31778 12.2489 4.64777 10.3207 4.26457C9.96888 4.19465 9.74158 3.85876 9.81299 3.51433Z"
      fill="white"
    />
  </svg>
);
