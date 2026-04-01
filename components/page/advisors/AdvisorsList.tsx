'use client';

import { useState } from 'react';
import { useGetAdvisors } from '@/services/advisors/hooks/useGetAdvisors';
import { AdvisorCard } from './AdvisorCard';
import styles from './AdvisorsList.module.scss';

export function AdvisorsList() {
  const { data: advisors, isLoading, isError } = useGetAdvisors();
  const [search, setSearch] = useState('');

  if (isLoading) return <div className={styles.loading}>Loading advisors...</div>;
  if (isError) return <div className={styles.error}>Failed to load advisors</div>;
  if (!advisors || advisors.length === 0) return <div className={styles.empty}>No advisors available</div>;

  const filtered = advisors.filter((advisor) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const nameMatch = advisor.member.name.toLowerCase().includes(query);
    const skillMatch = advisor.member.skills?.some((s) => s.title.toLowerCase().includes(query));
    return nameMatch || skillMatch;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Advisors</h1>
        <p className={styles.subtitle}>
          Connect with experienced operators who can help you solve specific challenges
        </p>
      </div>
      <input
        type="text"
        placeholder="Search by name or expertise..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.search}
      />
      <div className={styles.grid}>
        {filtered.map((advisor) => (
          <AdvisorCard key={advisor.id} advisor={advisor} />
        ))}
      </div>
      {filtered.length === 0 && search && (
        <div className={styles.empty}>No advisors match your search</div>
      )}
    </div>
  );
}
