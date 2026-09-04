'use client';

import Link from 'next/link';
import { HandHeart, Coins, ArrowsLeftRight, TrendUp, RocketLaunch, Flask, Code, Strategy, Check } from '@phosphor-icons/react';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import type { TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import styles from './overview.module.scss';
import type { CSSProperties, ReactNode } from 'react';

// CSSProperties doesn't type custom properties, so scoped `--ov-*` values
// (per-card accent colors) need this cast at the call site.
const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

interface HowItem {
  number: number;
  title: string;
  description: string;
  accent: string;
  badgeAccent?: string;
  iconOpacity?: string;
  icon: ReactNode;
  withActivitiesLink: boolean;
}

// Per the source design, the badge circle and border/icon share one accent
// for Contribute/Collect, but Convert/Capitalize use a second, darker
// accent for the badge only — see Overview - Active Member.dc.html's How
// It Works cards (border-top + icon vs. the numbered circle).
const HOW_ITEMS: HowItem[] = [
  {
    number: 1,
    title: 'Contribute',
    description: 'Share knowledge, make connections, and support the network.',
    accent: '#1b4dff',
    iconOpacity: '0.5',
    icon: <HandHeart size={20} weight="regular" />,
    withActivitiesLink: true,
  },
  {
    number: 2,
    title: 'Collect',
    description: 'Collect points for your contributions each snapshot period.',
    accent: '#2c6aee',
    icon: <Coins size={20} weight="regular" />,
    withActivitiesLink: false,
  },
  {
    number: 3,
    title: 'Convert',
    description: 'Points are converted into PLAA each month.',
    accent: '#1487c4',
    badgeAccent: '#0e6e9e',
    icon: <ArrowsLeftRight size={20} weight="regular" />,
    withActivitiesLink: false,
  },
  {
    number: 4,
    title: 'Capitalize',
    description: 'Buyback auctions may turn PLAA into realized value.',
    accent: '#12a594',
    badgeAccent: '#0b7a6d',
    icon: <TrendUp size={20} weight="regular" />,
    withActivitiesLink: false,
  },
];

const ROLE_ITEMS = [
  { role: 'Founders', description: 'driving new ventures', icon: <RocketLaunch size={19} weight="regular" /> },
  { role: 'Researchers', description: 'advancing core protocols', icon: <Flask size={19} weight="regular" /> },
  {
    role: 'Builders',
    description: 'shipping tools, products, and experiments',
    icon: <Code size={19} weight="regular" />,
  },
  { role: 'Operators', description: 'coordinating teams and projects', icon: <Strategy size={19} weight="regular" /> },
];

const BENEFIT_ITEMS = [
  'Get recognized for the work you’re already doing.',
  'Collect points that can convert to PLAA for verified activities.',
  'Access a wide network of collaborators and resources.',
  'Help shape the future of network-wide incentives.',
];

export interface OverviewToplineProps {
  trustHoldings?: TrustHoldingsData;
}

/**
 * Header, topline stats, How It Works, and Who It's For — identical for
 * both Active Member and Prospective Visitor personas per the "shared
 * topline" comment in the source design, so both persona components render
 * this rather than duplicating it.
 */
export default function OverviewTopline({ trustHoldings }: OverviewToplineProps) {
  const { onOverviewPortfolioLinkClicked, onOverviewActivitiesLinkClicked } = useAlignmentAssetsAnalytics();

  const handlePortfolioClick = () => onOverviewPortfolioLinkClicked('/alignment-asset/trust-holdings');
  const handleActivitiesClick = () => onOverviewActivitiesLinkClicked('/alignment-asset/activities', 'how-it-works');

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Overview</h1>
        <p className={styles.headerDesc}>
          The Protocol Labs Alignment Asset (PLAA) refers to both PLAA1 tokens and contractual rights to those tokens,
          redeemable through periodic buyback auctions. Whether you have rights or tokens, the experience is the same,
          so we just call it all PLAA.
        </p>
      </div>

      {/* ── Topline stats ── */}
      <div className={styles.statGrid}>
        <div className={styles.statCard} style={cssVars({ '--ov-accent': '#1b4dff' })}>
          <div className={styles.statValue}>
            10k <span className={styles.statValueUnit}>PLAA</span>
          </div>
          <div className={styles.statDesc}>available to support network activities each monthly snapshot</div>
        </div>
        <div className={styles.statCard} style={cssVars({ '--ov-accent': '#12a594' })}>
          <div className={styles.statValue}>{trustHoldings?.trustTotalValue ?? '—'}</div>
          <div className={styles.statDesc}>
            Net asset value backing PLAA — see{' '}
            <Link href="/alignment-asset/trust-holdings" className={styles.link} onClick={handlePortfolioClick}>
              Portfolio &amp; Holdings
            </Link>
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.howGrid}>
          {HOW_ITEMS.map((item) => (
            <div
              key={item.number}
              className={styles.howCard}
              style={cssVars({
                '--ov-accent': item.accent,
                ...(item.badgeAccent ? { '--ov-badge-accent': item.badgeAccent } : {}),
                ...(item.iconOpacity ? { '--ov-icon-opacity': item.iconOpacity } : {}),
              })}
            >
              <div className={styles.howCardHeader}>
                <span className={styles.howCardBadge}>{item.number}</span>
                <div className={styles.howCardTitle}>{item.title}</div>
              </div>
              <div className={styles.howCardDesc}>{item.description}</div>
              {item.withActivitiesLink ? (
                <div className={styles.howCardFooter}>
                  <span className={styles.howCardIcon}>{item.icon}</span>
                  <Link href="/alignment-asset/activities" className={styles.howCardLink} onClick={handleActivitiesClick}>
                    See activities →
                  </Link>
                </div>
              ) : (
                <span className={styles.howCardIcon}>{item.icon}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Who It's For ── */}
      <div className={`${styles.card} ${styles.whoCard}`}>
        <div className={styles.whoTop}>
          <h2 className={styles.sectionTitle}>Who It’s For</h2>
          <div className={styles.roleGrid}>
            {ROLE_ITEMS.map((item) => (
              <div key={item.role} className={styles.roleItem}>
                <span className={styles.roleIcon}>{item.icon}</span>
                <div>
                  <div className={styles.roleName}>{item.role}</div>
                  <div className={styles.roleDesc}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.benefitDivider}>
          <div className={styles.benefitGrid}>
            {BENEFIT_ITEMS.map((text) => (
              <div key={text} className={styles.benefitItem}>
                <Check size={14} weight="bold" className={styles.benefitCheck} />
                <span className={styles.benefitText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
