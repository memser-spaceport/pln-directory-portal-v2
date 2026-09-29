'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import type { PlaaHomeProps } from './home.types';
import { formatNumber } from './home.types';
import NavAreaChart from './nav-area-chart';
import { activitiesData } from '../activities/data';
import { UNDERUTILIZED_RATIO } from '../leaderboard/leaderboard.mapper';
import PlaaProspectBanner from './plaa-prospect-banner';
import PlaaDisclaimerBox from './plaa-disclaimer-box';
import {
  ArrowRight,
  ArrowsClockwise,
  CaretRight,
  CheckCircle,
  PaperPlaneTilt,
  TrendDown,
  TrendUp,
  type Icon,
} from '@phosphor-icons/react';

const ACTIVITIES_URL = '/alignment-asset/activities';
const TRUST_URL = '/alignment-asset/portfolio-holdings';
const PROFILE_URL = '/alignment-asset/profile';
const OVERVIEW_URL = '/alignment-asset/overview';

const INCENTIVE_SECTION_ID = 'plaa-incentive';
const SCROLL_GAP = 24;
/** Longer than the header's 180ms collapse transition in globals.scss. */
const COLLAPSE_SETTLE_MS = 420;

const TEASER_ACTIVITY_COUNT = 3;

const MODES: Record<string, { label: string; icon: Icon; tone: string }> = {
  Auto: { label: 'Auto-tracked', icon: ArrowsClockwise, tone: 'auto' },
  Submission: { label: 'Proof of work', icon: PaperPlaneTilt, tone: 'proof' },
  'Manual Review': { label: 'Reviewed', icon: CheckCircle, tone: 'confirm' },
};

const normaliseCategory = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
const NAV_DELTA_MONTHS = 3;

export default function PlaaHome({ round, trust, variant }: PlaaHomeProps) {
  const router = useRouter();
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();

  const isMember = variant === 'member';

  const go = (label: string, url: string) => {
    onNavMenuClicked(label, url);
    router.push(url);
  };

  // Full navigation, not router.push: the client router drops the `#login`
  // fragment the proxy adds, and that fragment is what opens the login dialog.
  const openSignin = () => {
    onNavMenuClicked('Get started', OVERVIEW_URL);
    window.location.assign(OVERVIEW_URL);
  };

  const scrollToIncentive = () => {
    onNavMenuClicked('See how you can contribute', `#${INCENTIVE_SECTION_ID}`);
    const target = document.getElementById(INCENTIVE_SECTION_ID);
    if (!target) return;

    const scroller =
      (Array.from(document.querySelectorAll('*')) as HTMLElement[]).find(
        (node) => /(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 50,
      ) ?? document.scrollingElement;
    if (!scroller) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const align = (behavior: ScrollBehavior) => {
      const headerBottom = document.querySelector('.layout__header')?.getBoundingClientRect().bottom ?? 0;
      const delta = target.getBoundingClientRect().top - headerBottom - SCROLL_GAP;
      scroller.scrollTo({ top: scroller.scrollTop + delta, behavior });
    };

    align(reduceMotion ? 'auto' : 'smooth');

    /* Scrolling collapses the snapshot bar, which shortens the header and pulls
       the content up mid-animation — so the first pass always undershoots by the
       bar's height. Re-align once the collapse transition has settled. */
    window.setTimeout(() => align('auto'), COLLAPSE_SETTLE_MS);
  };

  const heroStats: { value: string; label: string }[] = [];
  if (trust) {
    heroStats.push({
      value: `${formatNumber(trust.portfolioCompanies)}`,
      label: 'Investments in Frontier-tech Ventures',
    });
    heroStats.push({ value: trust.navPerPlaaHeadline, label: 'NAV per PLAA' });
  }
  heroStats.push({ value: formatNumber(round.onboardedParticipants), label: 'Onboarded participants' });

  const monthly = trust?.monthly ?? [];
  const latest = monthly[monthly.length - 1];
  const prior = monthly.length > NAV_DELTA_MONTHS ? monthly[monthly.length - 1 - NAV_DELTA_MONTHS] : undefined;
  const navDelta = latest && prior && prior.nav !== 0 ? ((latest.nav - prior.nav) / prior.nav) * 100 : undefined;

  const categoryPoints = new Map(round.chart.map((entry) => [normaliseCategory(entry.name), entry.value]));
  const busiestCategory = Math.max(...round.chart.map((entry) => entry.value), 0);
  const isUnderutilised = (category: string) =>
    busiestCategory > 0 &&
    (categoryPoints.get(normaliseCategory(category)) ?? 0) < busiestCategory * UNDERUTILIZED_RATIO;

  const teaserActivities = [...activitiesData.activities]
    .sort((a, b) => {
      const boost = Number(isUnderutilised(b.category)) - Number(isUnderutilised(a.category));
      return boost !== 0 ? boost : parseInt(b.points, 10) - parseInt(a.points, 10);
    })
    .slice(0, TEASER_ACTIVITY_COUNT);

  return (
    <div>
      {!isMember && (
        <>
          <PlaaProspectBanner portfolioCompanies={trust?.portfolioCompanies} onGetStarted={openSignin} />
        </>
      )}

      <div className="ph-hero">
        <div className="ph-hero__inner">
          <div className="ph-hero__grid">
            <div style={{ minWidth: 0 }}>
              <span className="ph-eyebrow-light">Protocol Labs Alignment Asset</span>
              <h1 className="ph-hero__title">PLAA is your access to tech&rsquo;s frontier</h1>
              <p className="ph-hero__sub">
                Backed by a diversified Trust spanning cash, crypto, and{' '}
                {trust ? `${formatNumber(trust.portfolioCompanies)} ` : ''}frontier-tech ventures &mdash; built by the
                people behind the Protocol Labs Network.
              </p>
              <div className="ph-hero__ctas">
                {isMember ? (
                  <button type="button" onClick={() => go('Contribute now', ACTIVITIES_URL)} className="ph-btn-white">
                    Contribute now
                    <ArrowRight weight="bold" size={17} aria-hidden />
                  </button>
                ) : (
                  <button type="button" onClick={openSignin} className="ph-btn-white">
                    Get started
                    <ArrowRight weight="bold" size={17} aria-hidden />
                  </button>
                )}
                {isMember ? (
                  <button type="button" onClick={() => go('View profile', PROFILE_URL)} className="ph-btn-ghost">
                    View profile
                  </button>
                ) : (
                  <button type="button" onClick={scrollToIncentive} className="ph-btn-ghost">
                    See how you can contribute
                  </button>
                )}
              </div>
            </div>

            {/* Versioned filename: replacing an image in place leaves Next's optimizer,
                CDNs and browsers serving the old bytes under the same URL. */}
            <div className="ph-hero__art">
              <Image
                src="/images/alignment-assets/hero-v2.png"
                alt=""
                aria-hidden="true"
                width={1180}
                height={1186}
                priority
                sizes="(max-width: 1024px) 70vw, 460px"
              />
            </div>
          </div>

          <div className="ph-hero__stats">
            {trust && (
              <div className="ph-hero__stat ph-hero__stat--first">
                <div className="ph-hero__stat-value">{trust.trustTotalValue}</div>
                <div className="ph-hero__stat-label">Total Trust NAV (Est. as of {trust.asOfDate})</div>
              </div>
            )}
            {heroStats.map((stat) => (
              <div key={stat.label} className="ph-hero__stat">
                <div className="ph-hero__stat-value">{stat.value}</div>
                <div className="ph-hero__stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <div className="ph-eyebrow">What backs PLAA</div>
        <h2 className="ph-h2">PLAA is backed by a broad base of assets.</h2>
        <p className="ph-lede">
          PLAA is a long-hold investment backed by a mix of venture investments from the Protocol Lab&apos;s Network
          along with large cap crypto and cash assets to support limited liquidity opportunties.
        </p>

        {trust ? (
          <>
            <div className="ph-backs-grid">
              <div className="ph-card">
                <div className="ph-card__head">
                  <div>
                    <div className="ph-card__eyebrow">TOTAL TRUST NAV (AS OF {trust.asOfDate.toUpperCase()})</div>
                    <div className="ph-card__figure">{trust.trustTotalValue}</div>
                  </div>
                  {navDelta !== undefined && (
                    <span className={`ph-delta ${navDelta >= 0 ? 'ph-delta--up' : 'ph-delta--down'}`}>
                      {navDelta >= 0 ? (
                        <TrendUp weight="bold" size={14} aria-hidden />
                      ) : (
                        <TrendDown weight="bold" size={14} aria-hidden />
                      )}
                      {navDelta >= 0 ? '+' : ''}
                      {navDelta.toFixed(1)}% (90d)
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '18px' }}>
                  <NavAreaChart points={monthly} gradientId="navhero" field="nav" height={140} showAxisLabels={false} />
                </div>
                {monthly.length > 1 && (
                  <div className="ph-card__axis">
                    <span>{monthly[0].label}</span>
                    <span>{monthly[monthly.length - 1].label}</span>
                  </div>
                )}
              </div>

              <div className="ph-card">
                <h3 className="ph-h3" style={{ marginBottom: '18px' }}>
                  Trust composition
                </h3>
                <div className="ph-comp">
                  <div className="ph-donut" style={{ background: buildConicGradient(trust.trustComposition) }}>
                    <div className="ph-donut__hole" />
                  </div>
                  <div className="ph-comp__legend">
                    {trust.trustComposition.map((slice) => (
                      <div key={slice.name} className="ph-comp__row">
                        <span className="ph-swatch" style={{ background: slice.color }} />
                        <span className="ph-comp__name">{slice.name}</span>
                        <span className="ph-comp__pct">{slice.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ph-card">
              <h3 className="ph-h3">Venture holdings by focus area</h3>
              <p className="ph-card__note">
                The largest share of the Trust &mdash; companies building the next technological frontier.
              </p>
              {trust.focusAreas.map((area) => (
                <div key={area.name} className="ph-focus">
                  <span className="ph-focus__name">{area.name}</span>
                  <div className="ph-focus__track">
                    <div className="ph-focus__fill" style={{ width: `${area.value}%` }} />
                  </div>
                  <span className="ph-focus__pct">{area.value}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="ph-card ph-unavailable">
            Portfolio &amp; holdings figures are unavailable right now.{' '}
            <button type="button" className="ph-linkbtn" onClick={() => go('Trust & Holdings', TRUST_URL)}>
              Open Portfolio &amp; Holdings
            </button>
          </div>
        )}
      </div>

      <div id={INCENTIVE_SECTION_ID} style={{ marginBottom: '24px', scrollMarginTop: '24px' }}>
        <div className="ph-eyebrow">PLAA AS THE NEXT GEN INCENTIVE</div>
        <h2 className="ph-h2">PLAA powers the Network&apos;s long-term alignment</h2>
        <p className="ph-lede" style={{ marginBottom: 0 }}>
          With PLAA used for the network&apos;s incentive layer, Protocol Labs is able to leverage expertise across its
          team and portfolio to work together in creating value.
        </p>
      </div>

      <div className="ph-ways">
        <div className="ph-flywheel" style={{ alignSelf: 'start' }}>
          <h3 className="ph-visually-hidden">The contribution flywheel</h3>
          <Image
            src="/images/alignment-assets/flywheel-v2.png"
            alt="The contribution flywheel. Employees and members of the PL Network collect PLAA for their contributions to increasing network value. The cycle runs: contribute, collect points, receive PLAA, the network grows, and repeats."
            width={1254}
            height={1254}
            sizes="(max-width: 1024px) 90vw, 520px"
          />
        </div>

        <div>
          <div className="ph-ways__head">
            <h3 className="ph-h3" style={{ font: 'var(--text-heading-md)' }}>
              {isMember ? 'A few ways to collect more points' : 'A few ways members contribute'}
            </h3>
            <button type="button" className="ph-linkbtn" onClick={() => go('Browse all activities', ACTIVITIES_URL)}>
              Browse all activities &rarr;
            </button>
          </div>
          <div className="ph-teasers">
            {teaserActivities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                className="ph-teaser"
                onClick={() => go(activity.activity, `${ACTIVITIES_URL}#${activity.id}`)}
              >
                <span className="ph-teaser__body">
                  <span className="ph-teaser__tags">
                    <span
                      className={`ph-tag ${isUnderutilised(activity.category) ? 'ph-tag--boost' : ''}`}
                      title={
                        isUnderutilised(activity.category)
                          ? 'This category is lightly contributed this snapshot — points here collect a larger share.'
                          : 'Standard weighting this snapshot.'
                      }
                    >
                      {activity.category}
                      {isUnderutilised(activity.category) && (
                        <b className="ph-tag__boost">
                          <TrendUp weight="fill" size={12} aria-hidden />
                        </b>
                      )}
                    </span>
                    {activity.verificationType && (
                      <span className={`ph-tag ph-tag--mode ph-tag--${MODES[activity.verificationType].tone}`}>
                        {(() => {
                          const ModeIcon = MODES[activity.verificationType].icon;
                          return <ModeIcon size={13} aria-hidden />;
                        })()}
                        {MODES[activity.verificationType].label}
                      </span>
                    )}
                  </span>
                  <span className="ph-teaser__title">{activity.activity}</span>
                </span>
                <span className="ph-teaser__pts">{activity.points} pts</span>
                <CaretRight size={16} style={{ color: 'var(--text-tertiary)' }} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <PlaaDisclaimerBox />

      <style jsx>{`
        .ph-hero {
          margin: calc(clamp(20px, 2.4vw, 36px) * -1) calc(var(--plaa-home-gutter) * -1) 56px;
          padding: clamp(48px, 5vw, 76px) var(--plaa-home-gutter) 0;
          background: var(--color-brand);
          color: #fff;
        }
        .ph-hero__inner {
          width: 100%;
        }
        .ph-hero__grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
          gap: 48px;
          align-items: center;
        }
        .ph-hero__art {
          min-width: 0;
          display: flex;
          justify-content: center;
        }
        .ph-hero__art :global(img) {
          width: 100%;
          max-width: 460px;
          height: auto;
          display: block;
        }
        .ph-eyebrow-light {
          font: var(--text-label-md);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.66);
        }
        .ph-hero__title {
          font-size: clamp(34px, 3.6vw, 52px);
          line-height: 1.1;
          font-weight: 500;
          letter-spacing: -0.032em;
          margin: 20px 0 0;
          text-wrap: pretty;
        }
        .ph-hero__sub {
          font-size: clamp(18px, 1.4vw, 21px);
          line-height: 1.45;
          letter-spacing: -0.01em;
          color: rgba(255, 255, 255, 0.74);
          margin: 18px 0 0;
          text-wrap: pretty;
        }
        .ph-hero__ctas {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 36px;
        }
        .ph-btn-white {
          height: 48px;
          padding: 0 24px;
          border: none;
          background: #fff;
          color: var(--color-brand-text);
          font: var(--text-heading-sm);
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .ph-btn-ghost {
          height: 48px;
          padding: 0 22px;
          border: 1px solid rgba(255, 255, 255, 0.42);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font: var(--text-heading-sm);
          border-radius: var(--radius-lg);
          cursor: pointer;
        }
        .ph-hero__stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
          margin-top: 64px;
          border-top: 1px solid rgba(255, 255, 255, 0.22);
        }
        .ph-hero__stat {
          padding: 22px 24px 30px;
          border-left: 1px solid rgba(255, 255, 255, 0.22);
          min-width: 0;
        }
        .ph-hero__stat--first {
          padding-left: 0;
          border-left: none;
        }
        .ph-hero__stat-value {
          font-size: clamp(24px, 2.3vw, 36px);
          font-weight: 600;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }
        .ph-hero__stat-label {
          font: var(--text-body-md);
          color: rgba(255, 255, 255, 0.72);
          margin-top: 6px;
        }
        .ph-eyebrow {
          font: var(--text-label-md);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-brand-text);
        }
        .ph-h2 {
          font: var(--text-display-sm);
          letter-spacing: -0.02em;
          margin: 10px 0 0;
          max-width: 620px;
        }
        .ph-h3 {
          font: var(--text-heading-sm);
        }
        .ph-lede {
          font: var(--text-body-lg);
          color: var(--text-secondary);
          margin: 12px 0 24px;
          max-width: max(700px, 70%);
        }
        .ph-card {
          background: var(--surface-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--ring-hairline), var(--shadow-xs);
          padding: 24px;
        }
        .ph-backs-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
          gap: 24px;
          margin-bottom: 16px;
        }
        .ph-card__head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .ph-card__eyebrow {
          font: var(--text-label-md);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 5px;
        }
        .ph-card__figure {
          font-size: 38px;
          font-weight: 700;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          margin-top: 4px;
        }
        .ph-card__axis {
          display: flex;
          justify-content: space-between;
          font: var(--text-label-md);
          color: var(--text-tertiary);
          margin-top: 6px;
        }
        .ph-card__note {
          font: var(--text-body-md);
          color: var(--text-tertiary);
          margin: 4px 0 8px;
        }
        .ph-delta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font: var(--text-label-lg);
          font-weight: 600;
          padding: 5px 11px;
          border-radius: 999px;
          flex: none;
          white-space: nowrap;
        }
        .ph-delta--up {
          color: var(--pl-green-600);
          background: rgba(10, 153, 82, 0.1);
        }
        .ph-delta--down {
          color: #e92215;
          background: rgba(233, 34, 21, 0.1);
        }
        .ph-comp {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .ph-donut {
          width: 118px;
          height: 118px;
          border-radius: 999px;
          flex: none;
          position: relative;
        }
        .ph-donut__hole {
          position: absolute;
          inset: 24px;
          background: var(--surface-card);
          border-radius: 999px;
        }
        .ph-comp__legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .ph-comp__row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ph-swatch {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex: none;
        }
        .ph-comp__name {
          font: var(--text-body-md);
          flex: 1;
          min-width: 0;
        }
        .ph-comp__pct {
          font: var(--text-label-lg);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .ph-focus {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid var(--border-faint);
        }
        .ph-focus__name {
          flex: 1;
          font: var(--text-body-md);
          min-width: 0;
        }
        .ph-focus__track {
          width: 160px;
          height: 6px;
          background: var(--surface-page);
          border-radius: 999px;
          overflow: hidden;
          flex: none;
        }
        .ph-focus__fill {
          height: 100%;
          background: var(--color-brand);
        }
        .ph-focus__pct {
          width: 48px;
          text-align: right;
          font: var(--text-label-md);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .ph-unavailable {
          font: var(--text-body-md);
          color: var(--text-secondary);
        }
        .ph-ways {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
          gap: 24px;
        }
        .ph-ways__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 14px;
          gap: 16px;
        }
        .ph-linkbtn {
          border: none;
          background: transparent;
          color: var(--color-brand-text);
          font: var(--text-label-lg);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .ph-teasers {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ph-teaser {
          background: var(--surface-card);
          border: none;
          border-radius: var(--radius-xl);
          box-shadow: var(--ring-hairline), var(--shadow-xs);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .ph-teaser__body {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .ph-teaser__tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
        }

        .ph-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font: var(--text-label-sm);
          font-weight: 400;
          color: var(--text-tertiary);
          background: var(--surface-page);
          box-shadow: var(--ring-hairline);
          white-space: nowrap;
        }
        .ph-tag--boost {
          font-weight: 600;
          color: var(--color-brand-text);
          background: rgba(11, 79, 102, 0.12);
          box-shadow: inset 0 0 0 1px rgba(11, 79, 102, 0.35);
        }
        .ph-tag__boost {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-left: 3px;
          font-weight: 700;
        }
        .ph-tag--mode {
          gap: 5px;
          padding: 3px 9px;
          font: var(--text-label-md);
          font-weight: 600;
          box-shadow: none;
        }
        .ph-tag--auto {
          color: var(--pl-slate-600);
          background: var(--pl-slate-50);
        }
        .ph-tag--confirm {
          color: var(--pl-blue-600);
          background: var(--pl-blue-50);
        }
        .ph-tag--proof {
          color: var(--pl-purple-500);
          background: rgba(151, 71, 255, 0.1);
        }
        .ph-teaser__title {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
          min-width: 0;
        }
        .ph-teaser__pts {
          flex: none;
          display: inline-flex;
          align-items: center;
          font: var(--text-label-md);
          font-weight: 600;
          color: var(--color-brand-text);
          background: var(--color-brand-subtle);
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .ph-flywheel {
          width: 100%;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          line-height: 0;
        }
        .ph-visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .ph-flywheel :global(img) {
          width: 100%;
          height: auto;
          display: block;
        }

        @media (max-width: 1024px) {
          .ph-backs-grid,
          .ph-ways {
            grid-template-columns: 1fr;
          }
          .ph-hero__grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
          }
          .ph-lede {
            max-width: none;
          }
          .ph-hero__art :global(img) {
            max-width: 360px;
          }
        }
        @media (max-width: 768px) {
          .ph-hero {
            margin: -20px -16px 40px;
            padding: 48px 16px 0;
          }
          .ph-hero__grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .ph-hero__stats {
            grid-template-columns: 1fr 1fr;
          }
          .ph-hero__stat,
          .ph-hero__stat--first {
            padding: 18px 12px 22px;
            border-left: none;
          }
          .ph-comp {
            flex-direction: column;
            align-items: flex-start;
          }
          .ph-focus__track {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}

function buildConicGradient(slices: { color: string; value: number }[]): string {
  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = cursor;
    cursor += slice.value;
    return `${slice.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(',')})`;
}
