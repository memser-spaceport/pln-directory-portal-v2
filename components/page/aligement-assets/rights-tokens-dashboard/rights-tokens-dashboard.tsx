'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { useCurrentUserStore } from '@/services/auth/store';
import { useRightsTokensBalance } from '@/services/rights-tokens/hooks/useRightsTokens';
import { IUserInfo } from '@/types/shared.types';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import styles from './rights-tokens-dashboard.module.css';

/* ==========================================================================
   Token Visibility Module (Rights & Tokens Dashboard)
   ========================================================================== */

function getWelcomeDisplayName(user: IUserInfo | null): string {
  const fullName = user?.name?.trim();
  if (fullName) return fullName.split(/\s+/)[0];

  const localUser = getUserInfoFromLocal() as IUserInfo | null;
  const localName = localUser?.name?.trim();
  if (localName) return localName.split(/\s+/)[0];

  const email = user?.email?.trim() || localUser?.email?.trim();
  if (email) return email.split('@')[0];

  return 'there';
}

const TOOLTIP_CONTENT = {
  total: 'PLAA Available to Bid in Buyback Auctions',
  collected: 'Combined Value of PLAA Owned + PLAA Sold',
  tokens: 'Tokens Available to Bid in Buyback Auctions',
  sold: 'Total PLAA Sold in Buyback Auctions',
} as const;

function formatLastUpdated(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const parts = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Denver',
    }).formatToParts(date);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';

    const month = get('month').toUpperCase();
    const day = get('day');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    const dayPeriod = get('dayPeriod').toUpperCase();

    return `LAST UPDATED ON ${month} ${day}, ${year} • ${hour}:${minute} ${dayPeriod} MT`;
  } catch {
    return '';
  }
}

function InfoTooltip({ content, label }: { content: string; label: string }) {
  return (
    <Tooltip
      asChild
      side="top"
      align="center"
      trigger={
        <span className={styles['rights-tokens-dashboard__info-trigger']} aria-label={label}>
          <Image src="/icons/rounds/info-gray.svg" alt="" width={16} height={16} />
        </span>
      }
      content={content}
    />
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  tooltip: string;
}

function StatCard({ icon, label, value, tooltip }: StatCardProps) {
  return (
    <div className={styles['rights-tokens-dashboard__stat-card']}>
      <div className={styles['rights-tokens-dashboard__stat-header']}>
        <div className={styles['rights-tokens-dashboard__stat-label-group']}>
          <span className={styles['rights-tokens-dashboard__stat-icon']}>
            <Image src={icon} alt="" width={16} height={16} />
          </span>
          <span className={styles['rights-tokens-dashboard__stat-label']}>{label}</span>
        </div>
        <InfoTooltip content={tooltip} label={`${label} info`} />
      </div>
      <span className={styles['rights-tokens-dashboard__stat-value']}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function RightsTokensDashboard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentUser = useCurrentUserStore((state) => state.currentUser);
  const { data, isLoading } = useRightsTokensBalance();

  if (isLoading) return null;
  if (!data) return null;

  const displayName = getWelcomeDisplayName(currentUser);
  const lastUpdatedLabel = formatLastUpdated(data.lastUpdated);

  return (
    <section className={styles['rights-tokens-dashboard']}>
      <div className={styles['rights-tokens-dashboard__header']}>
        <div className={styles['rights-tokens-dashboard__header-text']}>
          <div className={styles['rights-tokens-dashboard__title-row']}>
            <h2 className={styles['rights-tokens-dashboard__title']}>PLAA Dashboard</h2>
          </div>
          <p className={styles['rights-tokens-dashboard__subtitle']}>
            Welcome back {displayName} - here are your updated PLAA balances
          </p>
        </div>
        <button
          type="button"
          className={styles['rights-tokens-dashboard__toggle']}
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse dashboard' : 'Expand dashboard'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isExpanded ? styles['rights-tokens-dashboard__toggle-icon--open'] : ''}
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#475569"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className={styles['rights-tokens-dashboard__body']}>
          <div className={styles['rights-tokens-dashboard__panel']}>
            <div className={styles['rights-tokens-dashboard__panel-top']}>
              <div className={styles['rights-tokens-dashboard__primary-label-row']}>
                <span className={styles['rights-tokens-dashboard__title-icon']}>
                  <Image src="/icons/token-icon.svg" alt="" width={16} height={16} />
                </span>
                <span className={styles['rights-tokens-dashboard__primary-label']}>PLAA OWNED</span>
                <InfoTooltip content={TOOLTIP_CONTENT.total} label="My rights and tokens info" />
              </div>
              {lastUpdatedLabel && (
                <p className={styles['rights-tokens-dashboard__primary-updated']}>{lastUpdatedLabel}</p>
              )}
            </div>

            <div className={styles['rights-tokens-dashboard__primary-value-row']}>
              <span className={styles['rights-tokens-dashboard__primary-value']}>
                {data.totalRightsAndTokens.toLocaleString()}
              </span>
              <span className={styles['rights-tokens-dashboard__primary-unit']}>PLAA</span>
            </div>

            <div className={styles['rights-tokens-dashboard__stats']}>
              <StatCard
                icon="/icons/rights-icon.svg"
                label="PLAA COLLECTED"
                value={data.rights + data.tokens + data.tokensSold}
                tooltip={TOOLTIP_CONTENT.collected}
              />
              <StatCard
                icon="/icons/sold-icon.svg"
                label="PLAA SOLD"
                value={data.tokensSold}
                tooltip={TOOLTIP_CONTENT.sold}
              />
            </div>
          </div>

          <div className={styles['rights-tokens-dashboard__notice']}>
            <span className={styles['rights-tokens-dashboard__notice-icon']} aria-hidden="true">
              <Image src="/icons/rounds/info-gray.svg" alt="" width={16} height={16} />
            </span>
            <p className={styles['rights-tokens-dashboard__notice-text']}>
              PLAA balances displayed here are determined by Surus.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}