'use client';

import Link from 'next/link';
import {
  HandHeart,
  Coins,
  ArrowsLeftRight,
  TrendUp,
  RocketLaunch,
  Flask,
  Code,
  Strategy,
  Check,
  UserPlus,
  IdentificationCard,
  SealCheck,
  FileText,
  CheckCircle,
  Info,
  MapPin,
  ArrowUpRight,
  Database,
  LockKey,
  ArrowCounterClockwise,
  Lifebuoy,
} from '@phosphor-icons/react';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import { SUPPORT_EMAIL, SUPPORT_URL } from '@/constants/plaa';
import type { TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import styles from './overview.module.scss';
import type { CSSProperties, ReactNode } from 'react';

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

// Same Surus account URL used elsewhere (components/page/aligement-assets/rounds/data/current-round.data.ts).
const SURUS_URL = 'https://app.surus.io/';

const AT_GLANCE_STATS = [
  { value: '4', unit: 'simple steps' },
  { value: '~15', unit: 'mins hands-on' },
  { value: '1–2', unit: 'day verification' },
];

const ONBOARDING_STEPS = [
  {
    number: 1,
    title: 'Sign up on Surus',
    description:
      'Create your Surus account to set up your non-custodial wallet — the system of record for the Alignment Asset onboarding journey.',
    icon: <UserPlus size={22} weight="regular" />,
  },
  {
    number: 2,
    title: 'Complete KYC',
    description: 'Verify your identity inside Surus with SumSub. Required for everyone.',
    icon: <IdentificationCard size={22} weight="regular" />,
  },
  {
    number: 3,
    title: 'Complete accreditation',
    description: (
      <>
        If you’re US-based, Surus routes you through accreditation. Non-US participants can skip this step. Start
        ahead of time by obtaining a free accreditation letter through{' '}
        <a href="https://parallelmarkets.com/passport" target="_blank" rel="noopener noreferrer">
          Parallel Markets
        </a>
        .
      </>
    ),
    icon: <SealCheck size={22} weight="regular" />,
    pill: 'Required for US Residents',
    outlined: true,
  },
  {
    number: 4,
    title: 'Sign trust docs',
    description: 'Review and sign the trust documents — PPM and Rights Contract — via the Surus app.',
    icon: <FileText size={22} weight="regular" />,
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
// accent for the badge only — see Overview - Prospective Visitor.dc.html's
// How It Works cards (border-top + icon vs. the numbered circle).
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

const DETAILS_ITEMS = [
  {
    icon: <Database size={22} weight="regular" />,
    title: 'System of record',
    description: 'Surus tracks your onboarding status end to end.',
  },
  {
    icon: <LockKey size={22} weight="regular" />,
    title: 'Your info stays in Surus',
    description: 'All sensitive data stays with Surus or other trusted partners.',
  },
  {
    icon: <ArrowCounterClockwise size={22} weight="regular" />,
    title: 'Return anytime',
    description: 'Reopen Surus anytime to pick up where you left off.',
  },
];

export interface ProspectiveVisitorOverviewProps {
  trustHoldings?: TrustHoldingsData;
}

/**
 * Prospective Visitor variant of the Overview page — a not-yet-onboarded
 * member sees the Surus onboarding walkthrough here instead of the live
 * snapshot/points mechanics ActiveMemberOverview renders. Matches
 * `Overview - Prospective Visitor.dc.html`'s `ovIsProspect` branch of the
 * "Profile Page + Overview" Claude Design project.
 *
 * Section order/copy diverges from ActiveMemberOverview enough (different
 * hero, Who It's For before How It Works, a "How the PLAA Program Works"
 * intro instead of a top header) that this stays fully self-contained
 * rather than sharing overview-topline.tsx.
 */
export default function ProspectiveVisitorOverview({ trustHoldings }: ProspectiveVisitorOverviewProps) {
  const {
    onOverviewOnboardingLinkClicked,
    onOverviewPortfolioLinkClicked,
    onOverviewActivitiesLinkClicked,
    onOverviewFaqLinkClicked,
    onSupportOfficeHoursClicked,
    onSupportEmailClicked,
  } = useAlignmentAssetsAnalytics();
  useScrollDepthTracking('overview');

  const handleOnboardingClick = (source: 'hero' | 'cta-banner') => onOverviewOnboardingLinkClicked(SURUS_URL, source);
  const handlePortfolioClick = () => onOverviewPortfolioLinkClicked('/alignment-asset/trust-holdings');
  const handleActivitiesClick = () => onOverviewActivitiesLinkClicked('/alignment-asset/activities', 'how-it-works');
  const handleFaqClick = () => onOverviewFaqLinkClicked('/alignment-asset/faqs#onboarding');
  const handleOfficeHoursClick = () => onSupportOfficeHoursClicked(SUPPORT_URL);
  const handleEmailClick = () => onSupportEmailClicked(SUPPORT_EMAIL);

  return (
    <div className={styles.wrapper}>
      {/* ── Hero ── */}
      <div className={styles.prospectHero}>
        <div className={styles.prospectHeroCopy}>
          <h1 className={styles.headerTitle}>Participate in the network’s growth.</h1>
          <p className={styles.headerDesc}>
            Onboarding to the PL Alignment Asset is handled through Surus, our compliance and custody platform. This
            page outlines the onboarding steps and technical requirements. Once verified, you will have the
            foundation to collect PLAA based on your contributions to the network.
          </p>
          <div className={styles.prospectHeroActions}>
            <a
              href={SURUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBannerButton}
              style={{ background: 'var(--ov-blue-500)', color: '#fff', boxShadow: 'var(--ov-shadow-sm)' }}
              onClick={() => handleOnboardingClick('hero')}
            >
              Continue to Surus <ArrowUpRight size={16} weight="bold" />
            </a>
            <a href="#overview-steps" className={styles.prospectHeroSecondaryLink}>
              See the 4 steps
            </a>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.prospectAtGlanceLabel}>At a glance</div>
          <div className={styles.prospectAtGlanceStats}>
            {AT_GLANCE_STATS.map((stat) => (
              <div key={stat.unit} className={styles.prospectAtGlanceStat}>
                <div className={styles.prospectAtGlanceValue}>{stat.value}</div>
                <div className={styles.prospectAtGlanceUnit}>{stat.unit}</div>
              </div>
            ))}
          </div>
          <div className={styles.prospectAtGlanceDivider} />
          <div className={styles.prospectAtGlanceChecklist}>
            <div className={styles.prospectAtGlanceCheckItem}>
              <CheckCircle size={18} weight="fill" className={styles.prospectAtGlanceCheckIcon} />
              Completed inside the Surus app
            </div>
            <div className={styles.prospectAtGlanceCheckItem}>
              <CheckCircle size={18} weight="fill" className={styles.prospectAtGlanceCheckIcon} />
              Return anytime via your email link
            </div>
          </div>
        </div>
      </div>

      {/* ── How onboarding works ── */}
      <div id="overview-steps" className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>How onboarding works</h2>
          <p className={styles.sectionDesc}>
            <strong>No more than four steps</strong>, all completed within the Surus app. Complete only the ones that
            apply to you.
          </p>
        </div>

        <div className={styles.onboardingHighlight}>
          <CheckCircle size={16} weight="bold" />
          <span>
            <strong>Fast setup</strong> — Most participants complete their core application in under 15 minutes. KYC
            and accreditation reviews typically follow within 1–2 business days.
          </span>
        </div>

        <div className={styles.onboardingStepGridWrap}>
          <div className={styles.onboardingStepConnector} />
          <div className={styles.onboardingStepGrid}>
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.number} className={styles.onboardingStepCard}>
                <div className={styles.onboardingStepHeader}>
                  <span
                    className={`${styles.onboardingStepBadge} ${step.outlined ? styles.onboardingStepBadgeOutlined : ''}`}
                  >
                    {step.number}
                  </span>
                  <span className={styles.onboardingStepIcon}>{step.icon}</span>
                </div>
                <div className={styles.onboardingStepTitle}>{step.title}</div>
                <div className={styles.onboardingStepDesc}>{step.description}</div>
                {step.pill && <span className={styles.onboardingStepPill}>{step.pill}</span>}
              </div>
            ))}
          </div>
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

      {/* ── How the PLAA Program Works ── */}
      <div className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>How the PLAA Program Works</h2>
          <p className={styles.sectionDesc}>
            The Protocol Labs Alignment Asset (PLAA) refers to PLAA1 Rights that can be collected for beneficial
            contributions to the network and then redeemed through periodic buyback auctions sponsored by the Surus
            PLAA1 Trust.
          </p>
        </div>

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
      </div>

      {/* ── Important details to know ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Important details to know</h2>
        <p className={styles.sectionDesc}>
          Surus acts as the Trustee for the PLAA1 Trust. They manage the compliance and custody infrastructure for
          your onboarding journey.
          <br />
          Verification also grants investor-level access to PL Demo Day.
        </p>

        <div className={styles.detailsIconGrid}>
          {DETAILS_ITEMS.map((item) => (
            <div key={item.title} className={styles.detailsIconItem}>
              <span className={styles.detailsIconBadge}>{item.icon}</span>
              <div>
                <div className={styles.detailsIconTitle}>{item.title}</div>
                <div className={styles.detailsIconDesc}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.redeemFaqRow}>
          <Info size={18} weight="fill" className={styles.redeemFaqIcon} />
          <div className={styles.redeemFaqText}>
            Questions before you start? Check the{' '}
            <Link href="/alignment-asset/faqs#onboarding" onClick={handleFaqClick}>
              Onboarding FAQ
            </Link>{' '}
            or reach the program team at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className={styles.ctaBanner}>
        <div className={styles.ctaBannerText}>
          <h2 className={styles.ctaBannerTitle}>Unlock your path to PLAA.</h2>
          <p className={styles.ctaBannerDesc}>
            Pick up where you left off, or start fresh — Surus will recognize your account either way.
          </p>
        </div>
        <a
          href={SURUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBannerButton}
          onClick={() => handleOnboardingClick('cta-banner')}
        >
          Continue on Surus <ArrowUpRight size={16} weight="bold" />
        </a>
      </div>

      <div className={styles.footerNote}>
        <Lifebuoy size={18} weight="regular" />
        <span>
          Have questions or need help with onboarding?{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" onClick={handleOfficeHoursClick}>
            Schedule office hours
          </a>{' '}
          for 1:1 support or email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} onClick={handleEmailClick}>
            {SUPPORT_EMAIL}
          </a>
          .
        </span>
      </div>

      <div className={styles.geoNotice}>
        <MapPin size={17} weight="fill" className={styles.geoNoticeIcon} />
        <div className={styles.geoNoticeText}>
          Currently, the PL Alignment Asset is available to Germany, Switzerland, Portugal, and accredited investors
          in the US. To be notified as it becomes more widely available, please email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} onClick={handleEmailClick}>
            {SUPPORT_EMAIL}
          </a>{' '}
          to join the waitlist.
        </div>
      </div>
    </div>
  );
}
