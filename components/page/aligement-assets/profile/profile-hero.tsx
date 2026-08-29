'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import type { ProfileIdentity, ProfileBalance, ProfileBalanceStatus } from '@/services/plaa/hooks/useProfileData';
import ChevronIcon from './chevron-icon';

import styles from './profile-hero.module.css';

const SLIDE_TRANSITION = { duration: 0.2, ease: 'easeOut' } as const;

interface ProfileHeroProps {
  identity: ProfileIdentity;
  balance: ProfileBalance;
  balanceStatus: ProfileBalanceStatus;
  pointsThisSnapshot: number;
}

const balanceSourcesLabel = (expanded: boolean) => (expanded ? 'Hide PLAA balance breakdown' : 'Show PLAA balance breakdown');

function displayBalanceValue(status: ProfileBalanceStatus, value: number): string {
  if (status === 'ready') return value.toLocaleString();
  return status === 'loading' ? '···' : '—';
}

export default function ProfileHero({ identity, balance, balanceStatus, pointsThisSnapshot }: ProfileHeroProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);

  return (
    <div className={styles.hero}>
      <span className={styles.avatar}>
        {identity.avatarUrl ? (
          <Image src={identity.avatarUrl} alt="" width={72} height={72} className={styles.avatarImg} />
        ) : (
          identity.initials
        )}
      </span>

      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{identity.name}</h1>
        </div>
        {identity.memberSince && <div className={styles.memberSince}>Member since {identity.memberSince}</div>}
        <div className={styles.pills}>
          {identity.isOnboarded && (
            <span className={styles.onboardedPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.6-4.4-4.4 1.4-1.4 3 3 6-6 1.4 1.4-7.4 7.4Z" />
              </svg>
              Onboarded
            </span>
          )}
          {identity.isInfraMember && (
            <span className={styles.infraPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="7" cy="7" r="1" fill="currentColor" />
                <circle cx="7" cy="17" r="1" fill="currentColor" />
              </svg>
              Infra Member
            </span>
          )}
        </div>
      </div>

      <motion.div className={styles.balanceSection} layout transition={SLIDE_TRANSITION}>
        <AnimatePresence initial={false} mode="popLayout">
          {!expanded && (
            <motion.div
              key="points"
              className={styles.statBlock}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={SLIDE_TRANSITION}
            >
              <div className={`${styles.statValue} ${styles.points}`}>{pointsThisSnapshot.toLocaleString()}</div>
              <div className={styles.statLabel}>Points this snapshot</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          transition={SLIDE_TRANSITION}
          className={styles.balanceToggle}
          onClick={() => setExpanded((v) => !v)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-expanded={expanded}
          aria-label={balanceSourcesLabel(expanded)}
        >
          <div className={styles.statBlock}>
            <div className={styles.statValue}>{displayBalanceValue(balanceStatus, balance.plaaBalance)}</div>
            <div className={styles.statLabel}>PLAA balance</div>
            {balanceStatus === 'ready' ? (
              <div className={styles.confirmed}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.6-4.4-4.4 1.4-1.4 3 3 6-6 1.4 1.4-7.4 7.4Z" />
                </svg>
                Confirmed by Surus
              </div>
            ) : (
              <div className={styles.confirmed}>{balanceStatus === 'loading' ? 'Loading…' : 'Not yet available'}</div>
            )}
          </div>
          <span className={`${styles.caret} ${expanded ? styles.caretExpanded : ''}`}>
            {hovering && <span className={styles.tipBubble}>{balanceSourcesLabel(expanded)}</span>}
            <ChevronIcon expanded={expanded} direction="horizontal" />
          </span>
        </motion.button>

        <AnimatePresence initial={false} mode="popLayout">
          {expanded && (
            <motion.div
              key="breakdown"
              className={styles.breakdown}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={SLIDE_TRANSITION}
            >
              <span className={styles.breakdownLabel}>Activities</span>
              <span className={styles.breakdownValue}>{displayBalanceValue(balanceStatus, balance.activities)}</span>
              {balance.infraRewards > 0 && (
                <>
                  <span className={styles.breakdownLabel}>Infra rewards</span>
                  <span className={styles.breakdownValue}>{displayBalanceValue(balanceStatus, balance.infraRewards)}</span>
                </>
              )}
              <span className={styles.breakdownLabel}>Redeemed</span>
              <span className={styles.breakdownValue}>
                {balanceStatus === 'ready' ? `−${balance.redeemed.toLocaleString()}` : displayBalanceValue(balanceStatus, balance.redeemed)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
