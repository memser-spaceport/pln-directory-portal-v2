'use client';

import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { useState } from 'react';
import styles from './page.module.scss';

const ADVISOR_TOPICS = [
  { label: 'DeFi', count: 3 },
  { label: 'AI / ML', count: 2 },
  { label: 'Distributed Storage', count: 2 },
  { label: 'Smart Contracts', count: 2 },
  { label: 'Infrastructure', count: 3 },
  { label: 'Decentralised Compute', count: 1 },
  { label: 'Neurotech', count: 1 },
  { label: 'Cross-chain', count: 1 },
  { label: 'Tokenomics', count: 1 },
  { label: 'Web3 UX', count: 1 },
];

export default function AdvisorsFilters() {
  const [search, setSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  const filteredTopics = ADVISOR_TOPICS.filter((t) =>
    t.label.toLowerCase().includes(topicSearch.toLowerCase())
  );

  return (
    <div className={styles.root}>
      <FiltersSidePanel onClose={() => {}} clearParams={() => {}} appliedFiltersCount={0}>
        <FilterSection>
          <div className={styles.searchSection}>
            <label className={styles.searchLabel}>Search for an advisor</label>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="E.g. Sarah Chen"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <SearchIcon />
            </div>
          </div>
        </FilterSection>

        <FilterSection
          description="Advisors offer 30-min sessions to help founders with specific challenges."
        >
          <div className={styles.topicsSection}>
            <label className={styles.searchLabel}>Search topics</label>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="E.g. DeFi, Fundraising, AI"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className={styles.searchInput}
              />
              <SearchIcon />
            </div>
            <div className={styles.topicsList}>
              {filteredTopics.map((topic) => (
                <label key={topic.label} className={styles.topicItem}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span className={styles.topicLabel}>{topic.label}</span>
                  <span className={styles.topicCount}>{topic.count}</span>
                </label>
              ))}
            </div>
          </div>
        </FilterSection>
      </FiltersSidePanel>
    </div>
  );
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
    <path d="M14.3538 13.6462L11.2244 10.5175C12.1314 9.42855 12.5837 8.03186 12.489 6.61625C12.3944 5.20064 11.7598 3.87388 10.7164 2.90946C9.67299 1.94504 8.29992 1.41601 6.88178 1.43278C5.46363 1.44955 4.10361 2.0109 3.08226 3.00026C2.0609 3.98962 1.45655 5.33138 1.39435 6.74849C1.33215 8.1656 1.81699 9.5479 2.74689 10.6228C3.67679 11.6977 4.98129 12.3852 6.39473 12.5411C7.80818 12.6969 9.22479 12.3094 10.3581 11.4569L13.4869 14.5856C13.6031 14.6996 13.7595 14.7635 13.9225 14.7635C14.0855 14.7635 14.2419 14.6996 14.3581 14.5856C14.4741 14.4694 14.5381 14.313 14.5381 14.15C14.5381 13.987 14.4741 13.8306 14.3581 13.7144L14.3538 13.6462Z" fill="#94A3B8"/>
  </svg>
);
