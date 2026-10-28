'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useProfileData } from '@/services/plaa/hooks/useProfileData';
import ProfileHero from './profile-hero';
import PointsChart from './points-chart';
import SnapshotHistoryTab from './snapshot-history-tab';
import ContributionProfileTab from './contribution-profile-tab';

import styles from './profile.module.css';

type ProfileTabKey = 'snapshots' | 'contribution';

const PROFILE_TABS: Array<{ key: ProfileTabKey; label: string }> = [
  { key: 'contribution', label: 'Balance History' },
  { key: 'snapshots', label: 'Snapshot history' },
];

const Profile = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('contribution');
  const data = useProfileData();

  if (!data.identity.isOnboarded) {
    return (
      <div className={styles.notOnboarded}>
        <div className={styles.notOnboardedCard}>
          <span className={styles.notOnboardedIcon}>
            <Image src="/icons/profile-blue.svg" alt="" width={28} height={28} />
          </span>
          <h1 className={styles.notOnboardedTitle}>Your profile starts here</h1>
          <p className={styles.notOnboardedDesc}>
            Onboard to the Alignment Asset to build your member profile, contribute to the network, and start
            collecting recognition for your work.
          </p>
          <button
            className={styles.notOnboardedBtn}
            onClick={() => router.push(`${window.location.pathname}${window.location.search}#login`)}
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProfileHero
        identity={data.identity}
        balance={data.balance}
        balanceStatus={data.balanceStatus}
        pointsThisSnapshot={data.pointsThisSnapshot}
        currentSnapshotLabel={data.currentSnapshotLabel}
      />

      <div className={styles.tabs} role="tablist">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'snapshots' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {/* The points per snapshot; the rows below break each one down into the activities behind it. */}
          <PointsChart entries={data.contributionHistory} />
          <SnapshotHistoryTab entries={data.snapshotHistory} />
        </div>
      )}
      {activeTab === 'contribution' && (
        <ContributionProfileTab
          entries={data.contributionHistory}
          currentBalance={data.balanceStatus === 'ready' ? data.balance.plaaBalance : null}
          totalRedeemed={data.balanceStatus === 'ready' ? data.balance.redeemed : null}
        />
      )}
    </div>
  );
};

export default Profile;
