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

const ACTIVITIES_URL = '/alignment-asset/activities';
const TRUST_URL = '/alignment-asset/trust-holdings';
const PROFILE_URL = '/alignment-asset/profile';
const OVERVIEW_URL = '/alignment-asset/overview';

/** Scroll target for the prospect hero's second CTA. */
const INCENTIVE_SECTION_ID = 'plaa-incentive';
/** Breathing room above the section heading once it is scrolled to. */
const SCROLL_GAP = 24;
/** Longer than the header's 180ms collapse transition in globals.scss. */
const COLLAPSE_SETTLE_MS = 420;

/** Teaser count in the design. */
const TEASER_ACTIVITY_COUNT = 3;

/**
 * The design's submission-mode pill (modeMeta() in the prototype), keyed off
 * the catalogue's verificationType. `Manual Review` has no prototype
 * equivalent, so it reuses the proof-of-work treatment.
 */
const MODES: Record<string, { label: string; icon: string; tone: string }> = {
  Auto: { label: 'Auto-tracked', icon: 'ph ph-arrows-clockwise', tone: 'auto' },
  Submission: { label: 'Proof of work', icon: 'ph ph-paper-plane-tilt', tone: 'proof' },
  'Manual Review': { label: 'Reviewed', icon: 'ph ph-check-circle', tone: 'confirm' },
};

/** `People/Talent` here vs `People / Talent` there — compare on letters only. */
const normaliseCategory = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
/** 90-day NAV delta = 3 monthly closes back, per the design's "(90d)" pill. */
const NAV_DELTA_MONTHS = 3;

/**
 * The PLAA home — transcribed from .design-src/_views/00-prospect-home.html.
 *
 * One page serves both personas, as the prototype does
 * (`showProspect: !onboarded || persona === 'active'`). Only the hero calls to
 * action and the "ways to contribute" heading differ; everything else is
 * identical, so the two states cannot drift apart.
 *
 * Every figure comes from getTrustHoldings()/getCurrentRoundStats(); the
 * prototype's $6.74M, "750+", "190+" and the illustrative NAV path are fixtures
 * and are not reproduced.
 */
export default function PlaaHome({ round, trust, variant }: PlaaHomeProps) {
  const router = useRouter();
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();


  const isMember = variant === 'member';

  const go = (label: string, url: string) => {
    onNavMenuClicked(label, url);
    router.push(url);
  };

  /**
   * Overview is a protected route, so the proxy bounces a signed-out visitor to
   * `/members?backlink=/alignment-asset/overview#login` and PrivyModals returns
   * them to Overview once authenticated. Someone who already has a session just
   * lands on Overview directly.
   *
   * A full navigation, not router.push: the client router drops the `#login`
   * fragment the proxy attaches, and that fragment is what opens the login
   * dialog. Without it the visitor arrives at /members with no prompt.
   */
  const openSignin = () => {
    onNavMenuClicked('Get started', OVERVIEW_URL);
    window.location.assign(OVERVIEW_URL);
  };

  /**
   * Same-page jump to the incentive section. The app scrolls an inner container
   * and the site header is sticky over it, so `scrollIntoView` alone parks the
   * heading underneath the header — the offset is applied by hand against the
   * real scroller. Honours reduced-motion.
   */
  const scrollToIncentive = () => {
    onNavMenuClicked('See how you can contribute', `#${INCENTIVE_SECTION_ID}`);
    const target = document.getElementById(INCENTIVE_SECTION_ID);
    if (!target) return;

    const scroller =
      (Array.from(document.querySelectorAll('*')) as HTMLElement[]).find(
        (node) =>
          /(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 50,
      ) ?? document.scrollingElement;
    if (!scroller) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Aim below whatever the header currently occupies. It is sticky over the
       scroller, so a raw scrollIntoView tucks the heading under it. */
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

  // The design shows four hero proof points. Only the ones the backend can
  // answer are rendered — "750+ Network Organizations" has no endpoint.
  const heroStats: { value: string; label: string }[] = [];
  if (trust) {
    heroStats.push({ value: `${formatNumber(trust.portfolioCompanies)}`, label: 'Investments in Frontier-tech Ventures' });
    heroStats.push({ value: trust.navPerPlaaHeadline, label: 'NAV per PLAA' });
  }
  heroStats.push({ value: formatNumber(round.onboardedParticipants), label: 'Onboarded participants' });

  const monthly = trust?.monthly ?? [];
  const latest = monthly[monthly.length - 1];
  const prior = monthly.length > NAV_DELTA_MONTHS ? monthly[monthly.length - 1 - NAV_DELTA_MONTHS] : undefined;
  const navDelta = latest && prior && prior.nav !== 0 ? ((latest.nav - prior.nav) / prior.nav) * 100 : undefined;

  /*
   * Teasers come from the activities catalogue, not round.incentivizedActivities:
   * that field lists programme labels ("AA Program Contribution", "Buyback"),
   * and only 2 of its 26 entries correspond to a real activity, so it cannot
   * supply a category or a points value. The catalogue is the same source the
   * Activities page renders, so a card here can never disagree with the page it
   * links to.
   *
   * Ordering is live: categories running below UNDERUTILIZED_RATIO of the
   * busiest one this snapshot surface first — those are where points go
   * furthest — then by points. Same rule the Leaderboard's boost cards use.
   */
  const categoryPoints = new Map(round.chart.map((entry) => [normaliseCategory(entry.name), entry.value]));
  const busiestCategory = Math.max(...round.chart.map((entry) => entry.value), 0);
  const isUnderutilised = (category: string) =>
    busiestCategory > 0 && (categoryPoints.get(normaliseCategory(category)) ?? 0) < busiestCategory * UNDERUTILIZED_RATIO;

  const teaserActivities = [...activitiesData.activities]
    .sort((a, b) => {
      const boost = Number(isUnderutilised(b.category)) - Number(isUnderutilised(a.category));
      return boost !== 0 ? boost : parseInt(b.points, 10) - parseInt(a.points, 10);
    })
    .slice(0, TEASER_ACTIVITY_COUNT);

  return (
    <div>
      {/* Prospects get the dark "New to PLAA?" banner; members already have the
          snapshot bar above the LabOS navbar, so they do not get a second one. */}
      {!isMember && (
        <>
          <PlaaProspectBanner portfolioCompanies={trust?.portfolioCompanies} onGetStarted={openSignin} />

        </>
      )}

      {/* ===== MARKETING HERO (full bleed) ===== */}
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
              {/* Persona split #1: the prototype's heroCta1/heroCta2. */}
              <div className="ph-hero__ctas">
                {isMember ? (
                  <button type="button" onClick={() => go('Contribute now', ACTIVITIES_URL)} className="ph-btn-white">
                    Contribute now
                    <i className="ph-bold ph-arrow-right" style={{ fontSize: '17px' }} />
                  </button>
                ) : (
                  <button type="button" onClick={openSignin} className="ph-btn-white">
                    Get started
                    <i className="ph-bold ph-arrow-right" style={{ fontSize: '17px' }} />
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

            {/* The design's hero image slot. v2 of the artwork ships as a
                transparent cutout, so it composites straight onto the brand
                panel — no backdrop repaint needed. Its transparent border is
                trimmed so the artwork fills the slot instead of floating inside
                ~12% of empty frame.

                Versioned filename on purpose: replacing an image in place
                leaves Next's optimizer, CDNs and browsers serving the previous
                bytes under the same URL. Decorative — the headline carries the
                meaning. */}
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

      {/* ===== what backs PLAA ===== */}
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
                      <i className={navDelta >= 0 ? 'ph-bold ph-trend-up' : 'ph-bold ph-trend-down'} style={{ fontSize: '14px' }} />
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
                  <div
                    className="ph-donut"
                    style={{ background: buildConicGradient(trust.trustComposition) }}
                  >
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
            Trust &amp; holdings figures are unavailable right now.{' '}
            <button type="button" className="ph-linkbtn" onClick={() => go('Trust & Holdings', TRUST_URL)}>
              Open Trust &amp; Holdings
            </button>
          </div>
        )}
      </div>

      {/* ===== how you get it ===== */}
      <div id={INCENTIVE_SECTION_ID} style={{ marginBottom: '24px', scrollMarginTop: '24px' }}>
        <div className="ph-eyebrow">PLAA AS THE NEXT GEN INCENTIVE</div>
        <h2 className="ph-h2">PLAA powers the Network&apos;s long-term alignment</h2>
        <p className="ph-lede" style={{ marginBottom: 0 }}>
          With PLAA used for the network&apos;s incentive layer, Protocol Labs is able to leverage expertise across its
          team and portfolio to work together in creating value.
        </p>
      </div>

      <div className="ph-ways">
        {/* The supplied artwork carries the heading, the body copy and the
            cycle labels itself, so the card is the image — repeating them in
            markup would show them twice. The <h3> is kept for the document
            outline and screen readers but hidden visually, and the alt text
            restates the copy that now only exists as pixels. */}
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
              {/* Persona split #2: the prototype's waysHeading. */}
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
                          <i className="ph-fill ph-trend-up" style={{ fontSize: '12px' }} />
                        </b>
                      )}
                    </span>
                    {activity.verificationType && (
                      <span className={`ph-tag ph-tag--mode ph-tag--${MODES[activity.verificationType].tone}`}>
                        <i className={MODES[activity.verificationType].icon} style={{ fontSize: '13px' }} />
                        {MODES[activity.verificationType].label}
                      </span>
                    )}
                  </span>
                  <span className="ph-teaser__title">{activity.activity}</span>
                </span>
                <span className="ph-teaser__pts">{activity.points} pts</span>
                <i className="ph ph-caret-right" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* "Learn more" / explainer video section is pulled for now — the video
          asset does not exist yet. `plaa-video-card.tsx` is kept intact; render
          it here again when the asset lands (PLAA-94). */}

      <PlaaDisclaimerBox />

      <style jsx>{`
        .ph-hero {
          /* Bleeds out of the page gutter so the brand panel spans the full
             content column, then re-applies the gutter as its own padding. */
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
          /* The design's two-track hero: copy left, artwork right. */
          grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
          gap: 48px;
          align-items: center;
        }
        .ph-hero__art {
          min-width: 0;
          display: flex;
          justify-content: center;
        }
        /* :global — next/image renders its own <img>, which styled-jsx cannot
           scope a class onto. */
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
          /* Reaches into the second card below without running the full width,
             which pushed lines past 150 characters on a wide monitor.
             Percentage so it tracks the column, with a 700px floor so the
             measure never collapses at the narrow end of the desktop range. */
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
          /* minmax(0,…) so a wide chart can't push the track past the column. */
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

        /* Pills transcribed from the prototype's catPill / pill() / points
           span (.design-src/Home Page.dc.html). */
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
        /* shareMeta('open'): a lightly contributed category this snapshot.
           Tinted with the PLAA primary rather than the prototype's green, so
           the highlight belongs to the page instead of reading as a status. */
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
        /* modeMeta(): one colour per submission mode. */
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
          /* The artwork is the whole card: it brings its own brand panel, so
             there is no white plate around it, just the rounded corners. */
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
        /* :global — styled-jsx scopes classes to elements in this component's
           own JSX, and next/image renders the <img> itself, so the scoped
           selector would never match it. */
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
          /* Below this the copy column gets too narrow to sit beside the
             artwork, so the hero stacks and the image caps its own width. */
          .ph-hero__grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
          }
          /* Once the cards stack there is no second card to align to, so the
             intro goes full width instead of leaving a ragged gap. */
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

/** Donut slices, in order, from the live composition percentages. */
function buildConicGradient(slices: { color: string; value: number }[]): string {
  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = cursor;
    cursor += slice.value;
    return `${slice.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(',')})`;
}
