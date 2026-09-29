'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
// The page keeps the completed Demo Day template's root, white content sheet,
// hero and footer (DemodayCompletedView).
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import { SpvHero, type SpvHeroVariant } from './SpvHero';
import { SpvExploreTile } from './SpvExploreTile';
import { SpvNavBar } from './SpvNavBar';
import { SpvCardAction, SpvCardStatus, SpvTeamSpotlight } from './SpvTeamSpotlight';
import { netholabs, NETHOLABS_FACTS, NETHOLABS_SUMMARY, NETHOLABS_WEBSITE_IMAGES } from './netholabs';
import { SpvInvestorProfileDrawer, type InvestorRecord } from './SpvInvestorProfileDrawer';
import { SpvApplyModal, SpvAppliedModal } from './SpvApplyModal';
import {
  mockSignedInUser,
  mockInvestorProfile,
  mockInvestorDetails,
  mockSpotlight,
  spvFaqItems,
  VIEWER_OPTIONS,
  type SpvStatus,
  type SpvViewer,
} from './mocks';
import s from './SpvSpotlight.module.scss';

/**
 * Investor-facing SPV Spotlight at `/spv-spotlight/[slug]` (LAB-2669).
 *
 * Per the 2026-09-28 sync (Vova, Anuj): one SPV Spotlight is for ONE team, and
 * PL no longer hosts pitch slides or video. So the page is a title, a
 * description, then a brief card for that one team (Netholabs,
 * real data in netholabs.ts), with no site navigation. The card is PL
 * Spotlight's single team card trimmed — logo, name, one-liner, location and
 * size, website / stage / tags, founders, a three-sentence summary — with
 * images from the team's own website in a carousel where the pitch slide and
 * video were (SpvTeamSpotlight). The CTAs:
 *
 * - Request access to data room — the primary until approved (named at the
 *   2026-09-29 sync, was "Apply to invest"). Requesting is signing up: it
 *   creates the investor's account, so it has to stay low-friction. It sits in
 *   the team card's action slot (moved out of the hero 2026-09-29), with
 *   "Already have an account? Sign in" under it for signed-out viewers (was
 *   "Already requested access?" — requesting creates the account, so the line
 *   is for anyone with one: a past requester or an existing member).
 * - Open data room — the team's one DocSend, once approved and open (renamed
 *   from "View materials" in the 2026-09-29 review); the same card slot, since
 *   it's the next state of the same door.
 * - Every other state holds that slot with a quiet line (pending, opening
 *   soon, declined, closed); the hero carries the stepper and messages.
 * - Explore PL Network — a separate landing for investors new to the network
 *   (prototype `explore-pl-network`): what PL is, an FAQ, the portfolio teams.
 *   A tile under the card.
 * - Set up / Edit investor profile — a small text link in the hero for approved
 *   viewers (and in the pending stepper), Signed-in viewers also get the account avatar in the
 *   top bar, which opens their profile (2026-09-29 review).
 * - An FAQ at the bottom (same review), the questions the Explore landing
 *   carries too.
 *
 * Two kinds of link reach this page: the public link (everyone applies), and a
 * per-investor whitelisted link whose login token signs them in on arrival as
 * already approved (the preview bar doesn't simulate this one).
 *
 * Decisions still mine, not the team's:
 * - Pending return visit → the applied stepper, no Apply, so nobody applies twice.
 * - Rejected → says so plainly, no Apply.
 */

// The preview bar no longer switches the Spotlight's status (Draft / Open /
// Closed tabs removed 2026-09-29), so the page previews an OPEN Spotlight. The
// opening-soon and closed branches stay below for the frontend spec.
const status: SpvStatus = 'OPEN';

const resolveVariant = (status: SpvStatus, viewer: SpvViewer): SpvHeroVariant => {
  if (status === 'CLOSED') return 'closed';
  if (viewer === 'pending') return 'pending';
  if (viewer === 'rejected') return 'rejected';
  if (viewer === 'approved') return status === 'OPEN' ? 'open' : 'openingSoon';
  return 'landing';
};

const HINTS: Record<SpvHeroVariant, string> = {
  landing: 'Public link: requesting access = sign up. Try applied@example.com to see the “already requested” prompt.',
  pending: 'Requested, awaiting admin review. No request button, no data room.',
  rejected: 'Declined. Cannot request again.',
  openingSoon: 'Approved, Spotlight still in draft. No DocSend yet.',
  open: 'Approved + open: Open data room opens the team’s DocSend.',
  closed: 'Closed — the same message for every viewer.',
};

export default function SpvSpotlightPrototype() {
  const [mounted, setMounted] = useState(false);
  const [viewer, setViewer] = useState<SpvViewer>('signedOut');
  const [applyOpen, setApplyOpen] = useState(false);
  const [appliedEmail, setAppliedEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState(mockSignedInUser.email);
  // The applicant's own profile, edited in the investor-profile drawer.
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(mockInvestorProfile);
  const [investor, setInvestor] = useState<InvestorRecord>(mockInvestorDetails);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.page} />;

  const isLoggedIn = viewer !== 'signedOut';
  // PitchSpotlightHero's "set it up" vs "keep it up to date": complete once a
  // way of investing is chosen and filled in (the rule InvestorProfileDetails
  // uses for its incomplete warning, simplified to the two ticks).
  const investorComplete =
    (investor.angel && investor.stages.length > 0 && !!investor.checkSize) || (investor.viaFund && !!investor.fundId);
  const variant = resolveVariant(status, viewer);
  // The team card's action slot: the data-room door, or a line saying why
  // there isn't one right now.
  const cardAction = (() => {
    switch (variant) {
      case 'landing':
        return (
          <SpvCardAction
            label="Request access to data room"
            onClick={() => setApplyOpen(true)}
            // Twin-action rule: the sign-in door is a text link, not a second
            // button. Invited investors skip it: their email link signs them in.
            note={
              isLoggedIn ? undefined : (
                <>
                  Already have an account?{' '}
                  {/* Production opens Privy. Here, signing in lands as a
                      signed-in viewer with no request yet; the request
                      form's email check still catches a past requester. */}
                  <button type="button" className={s.inlineLink} onClick={() => setViewer('notApplied')}>
                    Sign in
                  </button>
                </>
              )
            }
          />
        );
      case 'open':
        return <SpvCardAction label="Open data room" href={mockSpotlight.docSendUrl} />;
      // Every line names the data room (2026-09-29 review: "Access not
      // approved" → "Data room access not approved").
      case 'pending':
        return <SpvCardStatus>Data room access pending review</SpvCardStatus>;
      case 'openingSoon':
        return <SpvCardStatus>Approved, data room opens soon</SpvCardStatus>;
      case 'rejected':
        return <SpvCardStatus>Data room access not approved</SpvCardStatus>;
      case 'closed':
        return <SpvCardStatus>Data room closed</SpvCardStatus>;
    }
  })();

  const hint = HINTS[variant];

  return (
    <div className={s.page}>
      <div className={s.demoBar} role="group" aria-label="Prototype preview controls">
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
        <span className={s.demoHint}>{hint}</span>
      </div>

      <SpvNavBar
        label="PL Spotlight"
        account={
          isLoggedIn
            ? {
                name: profile.name,
                avatar: profile.avatar,
                onProfile: () => setProfileOpen(true),
                onSignOut: () => setViewer('signedOut'),
              }
            : undefined
        }
        // Same outcome as the card's "Sign in" link: signed in, no request yet.
        onSignIn={() => setViewer('notApplied')}
      />

      <div className={clsx(d.root, s.root)}>
        <div className={clsx(d.content, s.contentTight)}>
          <SpvHero
            variant={variant}
            title={mockSpotlight.title}
            description={mockSpotlight.description}
            profileComplete={investorComplete}
            onEditProfile={() => setProfileOpen(true)}
          />

          {/* The one team this SPV is for, as a brief official card. Public
              directory info, so every viewer and status sees it; what
              approval unlocks is the DocSend, behind the card's action. */}
          <section className={s.teamSection} aria-label={`About ${netholabs.name}`}>
            <SpvTeamSpotlight
              team={netholabs}
              facts={NETHOLABS_FACTS}
              summary={NETHOLABS_SUMMARY}
              images={NETHOLABS_WEBSITE_IMAGES}
              aboutHtml={netholabs.team.longDescription ?? undefined}
              aboutOpen={variant === 'pending'}
              action={cardAction}
              // Remount when the state changes so the default open/closed applies.
              key={variant === 'pending' ? 'open' : 'closed'}
            />
          </section>

          {/* Explore PL Network is a tile, not a hero button (decided 2026-09-29):
              it says what the network is before asking for the click, and it
              no longer outranks the card's data-room action. */}
          <section className={s.exploreSection} aria-label="Explore the PL Network">
            <SpvExploreTile />
          </section>

          <section className={d.sectionFaq}>
            <FAQ
              title="Questions investors ask"
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
              © 2026 Protocol Labs. All content is provided by the founders. Protocol Labs does not endorse or
              recommend any investment, and is not a broker, dealer, or advisor. Questions? Write to{' '}
              <a href={`mailto:${mockSpotlight.supportEmail}`} className={d.infoLink}>
                {mockSpotlight.supportEmail}
              </a>
              .
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

      <SpvApplyModal
        key={viewer}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        // "Request access to the Netholabs data room": the team's name, since
        // the page title now reads "SPV Spotlight: Netholabs".
        spotlightTitle={netholabs.name}
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
