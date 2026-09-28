'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useToggle } from 'react-use';
import { AppLogo } from '@/components/core/navbar/components/icons';
import { Button } from '@/components/common/Button';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
// The page is the completed Demo Day template (DemodayCompletedView): its root,
// white content sheet, partners / FAQ / footer sections, and the teams grid
// from CompletedDemoDayTeamsList.
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import t from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/CompletedDemoDayTeamsList.module.scss';
import { SpvHero, type SpvHeroVariant } from './SpvHero';
import { SpvLogos } from './SpvLogos';
import { SpvTeamCard } from './SpvTeamCard';
import { SpvTeamDrawer } from './SpvTeamDrawer';
import { SpvInvestorProfileDrawer, type InvestorRecord } from './SpvInvestorProfileDrawer';
import { spvTeams } from './teams';
import { SpvApplyModal, SpvAppliedModal } from './SpvApplyModal';
import {
  mockSignedInUser,
  mockInvestorProfile,
  mockInvestorDetails,
  mockSpotlight,
  spvFaqItems,
  STATUS_OPTIONS,
  VIEWER_OPTIONS,
  type SpvStatus,
  type SpvViewer,
} from './mocks';
import s from './SpvSpotlight.module.scss';

/**
 * Investor-facing SPV Spotlight at `/spv-spotlight/[slug]` (LAB-2669).
 *
 * One Spotlight can hold many teams, so the page is the completed Demo Day
 * template rather than PL Spotlight's single-team card: status badge + hero,
 * a teams grid with Show All, partner logos, an FAQ that explains what PL
 * Spotlight is, and the Demo Day footer. What changes for the SPV:
 *
 * - Chromeless: no site navigation, only a non-link wordmark. Prototype routes
 *   already hide SiteHeader, so what you see is what ships.
 * - Apply is the primary door (Demo Day's apply + success modals, trimmed);
 *   sign-in is a text link under it.
 * - Every team has its own DocSend: approved investors get a View materials
 *   button on each card and in each team's drawer.
 * - A card opens the Demo Day team drawer holding the dev team page's
 *   sections (details, contact, membership, contributions, members, focus
 *   areas, projects, news), with prev / next to walk the list.
 *
 * Decisions on the ticket's open questions:
 * - Pending return visit → its own message, no Apply, so nobody applies twice.
 * - OPEN + not approved → the teams grid and drawers show. The team page is
 *   public directory info already; approval unlocks each team's DocSend, and
 *   the drawer offers Apply where View materials would be.
 * - DRAFT and CLOSED → no teams grid for anyone, per the ticket.
 * - Rejected → says so plainly, no Apply.
 */

const TEAMS_THRESHOLD = 6; // same as CompletedDemoDayTeamsList

const resolveVariant = (status: SpvStatus, viewer: SpvViewer): SpvHeroVariant => {
  if (status === 'CLOSED') return 'closed';
  if (viewer === 'pending') return 'pending';
  if (viewer === 'rejected') return 'rejected';
  if (viewer === 'approved') return status === 'OPEN' ? 'open' : 'openingSoon';
  return 'landing';
};

const HINTS: Record<SpvHeroVariant, string> = {
  landing: 'Landing + Apply. Try applying with applied@example.com to see the “already applied” prompt.',
  pending: 'Applied, awaiting admin review. No Apply, no materials.',
  rejected: 'Declined. Cannot re-apply.',
  openingSoon: 'Approved, Spotlight still in draft. No DocSend, no teams.',
  open: 'Approved + open: every team card and drawer has its own View materials.',
  closed: 'Closed — the same message for every viewer, no teams.',
};

export default function SpvSpotlightPrototype() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<SpvStatus>('OPEN');
  const [viewer, setViewer] = useState<SpvViewer>('signedOut');
  const [applyOpen, setApplyOpen] = useState(false);
  const [appliedEmail, setAppliedEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState(mockSignedInUser.email);
  // The applicant's own profile, edited in the investor-profile drawer.
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(mockInvestorProfile);
  const [investor, setInvestor] = useState<InvestorRecord>(mockInvestorDetails);
  const [showAllTeams, toggleShowAllTeams] = useToggle(false);
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.page} />;

  const isLoggedIn = viewer !== 'signedOut';
  // PitchSpotlightHero's "set it up" vs "keep it up to date": complete once a
  // way of investing is chosen and filled in (the rule InvestorProfileDetails
  // uses for its incomplete warning, simplified to the two ticks).
  const investorComplete =
    (investor.angel && investor.stages.length > 0 && !!investor.checkSize) || (investor.viaFund && !!investor.fundId);
  const variant = resolveVariant(status, viewer);
  const showTeams = status === 'OPEN';
  const teamsNum = spvTeams.length;
  // Per-team CTA: approved + open get each team's own DocSend; people who
  // haven't applied get Apply in the drawer; pending / rejected get neither.
  const teamCta: 'materials' | 'apply' | 'none' =
    variant === 'open' ? 'materials' : variant === 'landing' ? 'apply' : 'none';
  const browseTeams = () => document.getElementById('spv-teams')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={s.page}>
      <div className={s.demoBar} role="group" aria-label="Prototype preview controls">
        <span className={s.demoLabel}>Spotlight</span>
        <div className={s.segmented}>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={clsx(s.segment, { [s.segmentActive]: status === o.value })}
              onClick={() => setStatus(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className={s.demoLabel}>Viewer</span>
        <div className={s.segmented}>
          {VIEWER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={clsx(s.segment, { [s.segmentActive]: viewer === o.value })}
              onClick={() => {
                setViewer(o.value);
                setPendingEmail(mockSignedInUser.email);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className={s.demoHint}>{HINTS[variant]}</span>
      </div>

      <div className={clsx(d.root, s.root)}>
        <div className={s.brand} aria-label="PL Network">
          <AppLogo />
        </div>

        <div className={d.content}>
          <SpvHero
            variant={variant}
            status={status}
            isLoggedIn={isLoggedIn}
            email={pendingEmail}
            title={mockSpotlight.title}
            description={mockSpotlight.description}
            onBrowseTeams={browseTeams}
            onApply={() => setApplyOpen(true)}
            // Production opens Privy. Here, signing in lands you as an investor
            // the back office already approved (the CSV pre-approved path).
            onSignIn={() => setViewer('approved')}
            profileComplete={investorComplete}
            onEditProfile={() => setProfileOpen(true)}
          />

          {/* Teams sit straight under the hero — ahead of the partner logos,
              unlike the completed Demo Day — because here they are the offer. */}
          {showTeams && (
            <section id="spv-teams" className={t.sectionTeams}>
              <div className={t.subtitle}>
                <h2 className={t.label}>Teams in this Spotlight ({teamsNum})</h2>
                <p className={t.supportingText}>
                  {teamCta === 'materials'
                    ? 'Open a team for its full profile, or go straight to its materials.'
                    : 'Hand-picked PL Network teams across AI, crypto, DeSci and infrastructure. Open one for its full profile.'}
                </p>
              </div>
              <div className={t.cards}>
                <div
                  className={clsx(t.cardsGridContainer, {
                    [t.expanded]: showAllTeams || teamsNum <= TEAMS_THRESHOLD,
                  })}
                >
                  <div className={t.cardsGrid}>
                    {spvTeams.map((team, i) => (
                      <SpvTeamCard
                        key={team.uid}
                        team={team}
                        showMaterials={teamCta === 'materials'}
                        onOpen={() => setOpenTeamIndex(i)}
                      />
                    ))}
                  </div>
                  <div className={t.bottomShadow} />
                </div>
                {teamsNum > TEAMS_THRESHOLD && (
                  <Button size="s" style="border" onClick={toggleShowAllTeams}>
                    Show {showAllTeams ? 'Less' : 'All'} Teams
                  </Button>
                )}
              </div>
            </section>
          )}

          <section className={d.sectionPartners}>
            <div className={d.logosButtonContainer}>
              <SpvLogos />
            </div>
          </section>

          <section className={d.sectionFaq}>
            <FAQ
              title="About PL Spotlight"
              items={spvFaqItems}
              subtitle={
                <p className={d.infoText}>
                  Reach out to us at{' '}
                  <a href={`mailto:${mockSpotlight.supportEmail}`} className={d.infoLink}>
                    {mockSpotlight.supportEmail}
                  </a>{' '}
                  for any other questions.
                </p>
              }
            />
          </section>

          <footer className={d.footer}>
            <div className={d.note}>
              © 2026 Protocol Labs. All content is provided by the founders. Protocol Labs does not endorse or recommend
              any investment, and is not a broker, dealer, or advisor.
            </div>
            <div className={d.bottom}>
              <div className={d.links}>
                <a className={d.link} href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                <a className={d.link} href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
                  Terms & Conditions
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <SpvTeamDrawer
        team={showTeams && openTeamIndex !== null ? spvTeams[openTeamIndex] : null}
        index={openTeamIndex ?? 0}
        total={teamsNum}
        cta={teamCta}
        onClose={() => setOpenTeamIndex(null)}
        onStep={(delta) =>
          setOpenTeamIndex((i) => (i === null ? i : Math.min(teamsNum - 1, Math.max(0, i + delta))))
        }
        onApply={() => {
          setOpenTeamIndex(null);
          setApplyOpen(true);
        }}
      />

      <SpvApplyModal
        key={viewer}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        spotlightTitle={mockSpotlight.title}
        prefill={viewer === 'notApplied' ? mockSignedInUser : null}
        onSubmitted={(email) => {
          setApplyOpen(false);
          setAppliedEmail(email);
        }}
        onSignIn={(email) => {
          // Already applied → signing in shows that application's state.
          setPendingEmail(email);
          setViewer('pending');
        }}
      />

      <SpvAppliedModal
        isOpen={!!appliedEmail}
        email={appliedEmail ?? ''}
        onClose={() => {
          setPendingEmail(appliedEmail ?? mockSignedInUser.email);
          setAppliedEmail(null);
          setViewer('pending');
        }}
        onSetUpProfile={() => {
          setPendingEmail(appliedEmail ?? mockSignedInUser.email);
          setAppliedEmail(null);
          setViewer('pending');
          setProfileOpen(true);
        }}
      />

      <SpvInvestorProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onProfileChange={setProfile}
        investor={investor}
        onInvestorChange={setInvestor}
      />
    </div>
  );
}
