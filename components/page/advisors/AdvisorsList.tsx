'use client';

import { useGetAdvisors } from '@/services/advisors/hooks/useGetAdvisors';
import { AdvisorCard } from './AdvisorCard';
import styles from './AdvisorsList.module.scss';

export function AdvisorsList() {
  const { data: advisors, isLoading, isError } = useGetAdvisors();

  if (isLoading) return <div className={styles.loading}>Loading advisors...</div>;
  if (isError) return <div className={styles.error}>Failed to load advisors</div>;
  if (!advisors || advisors.length === 0) return <div className={styles.empty}>No advisors available</div>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Advisors</h1>
          <p className={styles.count}>({advisors.length})</p>
        </div>
      </div>
      <div className={styles.grid}>
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.id} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}
