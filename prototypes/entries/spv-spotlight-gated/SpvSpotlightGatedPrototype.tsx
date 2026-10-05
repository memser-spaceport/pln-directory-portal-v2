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
  REQUEST_FLOW_ENABLED,
  spvFaqItems,
  VIEWER_OPTIONS,
  type SpvStatus,
  type SpvViewer,
} from './mocks';
import s from './SpvSpotlight.module.scss';

/**
 * SPV Spotlight, token-gated — a copy of `spv-spotlight` reshaped by the
 * 2026-10-01 Prod/Eng standup (LAB-2669). What changed, and why:
 *
 * - **Invitation, not request.** Outreach emails link straight to DocSend;
 *   investors the PL team whitelists get a tokenised link to THIS page, which
 *   logs them in. So "Request access to data room" and the request modal, the
 *   pending stepper and the approval states are hidden behind
 *   REQUEST_FLOW_ENABLED (mocks.ts) — "feature flag it, don't remove it", as
 *   Demo Day taught us — and the primary is **Request data room access**, a plain
 *   link to the team's DocSend (no DocSend integration).
 * - **Locked states.** Without the token and a login, the page shows nothing of
 *   the deal — no title, no team, no FAQ: a lock message with Sign in (or "Use a
 *   different account" when logged in as someone not on the list), Contact us,
 *   and **Explore PL Network as a bigger tile** so a visitor has somewhere to
 *   go. This reverses the earlier "team info is public before login".
 * - **Secondary call to action: Set up investor profile**, beside Open data
 *   room, "so we can send you the deals you'd be interested in" (a deal is the
 *   venture word for a startup investment opportunity). It opens the investor
 *   profile drawer; Investor Details already asks what they invest in (focus,
 *   stages, check size), so it only gains one tick: "Email me deals that match".
 * - Contact us (mailto) replaces the questions block on the locked states; the
 *   FAQ stays for invited viewers, rewritten for the token model.
 *
 * Still open, to confirm with Anuj / Remy / Mark: what the token link does once
 * it expires or is used on a second device; whether "not on the list" should
 * show the signed-in email (it does here); fund-only investors get no focus /
 * check size fields in Investor Details (production behaviour), so deal emails
 * have nothing to match on for them.
 */

// The preview bar no longer switches the Spotlight's status (Draft / Open /
// Closed tabs removed 2026-09-29), so the page previews an OPEN Spotlight. The
// opening-soon and closed branches stay below for the frontend spec.
const status: SpvStatus = 'OPEN';

const resolveVariant = (status: SpvStatus, viewer: SpvViewer): SpvHeroVariant => {
  if (viewer === 'signedOut') return REQUEST_FLOW_ENABLED ? 'landing' : 'lockedSignedOut';
  if (viewer === 'notInvited') return REQUEST_FLOW_ENABLED ? 'landing' : 'lockedNoAccess';
  if (status === 'CLOSED') return 'closed';
  if (viewer === 'pending') return 'pending';
  if (viewer === 'rejected') return 'rejected';
  if (viewer === 'invited' || viewer === 'approved') return status === 'OPEN' ? 'open' : 'openingSoon';
  return 'landing';
};

const HINTS: Record<SpvHeroVariant, string> = {
  lockedSignedOut: 'No token and not logged in: locked. Nothing of the deal shows, only Explore PL Network.',
  lockedNoAccess: 'Logged in, but not on this Spotlight’s invitation list: locked, no deal.',
  landing: 'Legacy request flow (flag on).',
  pending: 'Legacy request flow (flag on).',
  rejected: 'Legacy request flow (flag on).',
  openingSoon: 'Invited, Spotlight still in draft. No DocSend yet.',
  open: 'The token link logged them in: Request data room access goes straight to the DocSend.',
  closed: 'Closed — the same message for every viewer.',
};

export default function SpvSpotlightGatedPrototype() {
  const [mounted, setMounted] = useState(false);
  const [viewer, setViewer] = useState<SpvViewer>('invited');
  const [applyOpen, setApplyOpen] = useState(false);
  const [appliedEmail, setAppliedEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState(mockSignedInUser.email);
  // The investor's own profile, edited in the investor-profile drawer.
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(mockInvestorProfile);
  const [investor, setInvestor] = useState<InvestorRecord>(mockInvestorDetails);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.page} />;

  const isLoggedIn = viewer !== 'signedOut';
  // The secondary call to action reads "Set up" until Investor Details says what
  // they invest in: a focus and a check size, so there is something to match on.
  const profileComplete = investor.focus.length > 0 && !!investor.checkSize;
  const variant = resolveVariant(status, viewer);
  const locked = variant === 'lockedSignedOut' || variant === 'lockedNoAccess';

  // The team card's action slot: the data-room door, or a line saying why
  // there isn't one right now.
  const cardAction = (() => {
    switch (variant) {
      case 'landing':
        return (
          <SpvCardAction
            label="Request access to data room"
            onClick={() => setApplyOpen(true)}
            note={
              isLoggedIn ? undefined : (
                <>
                  Already have an account?{' '}
                  <button type="button" className={s.inlineLink} onClick={() => setViewer('notApplied')}>
                    Sign in
                  </button>
                </>
              )
            }
          />
        );
      case 'open':
        return (
          <SpvCardAction
            // "Request", not "Open" (review 2026-10-02): an invited investor
            // still asks for access on DocSend, so the label names that step.
            label="Request data room access"
            href={mockSpotlight.docSendUrl}
            // The investor-profile door (2026-10-01), a link under the primary;
            // what it is for sits in the info tooltip beside it (2026-10-05).
            secondary={{
              label: profileComplete ? 'Edit your investor profile' : 'Set up your investor profile',
              onClick: () => setProfileOpen(true),
              info: 'Your investor preferences are used to fine-tune the deals we notify you about.',
            }}
          />
        );
      case 'pending':
        return <SpvCardStatus>Data room access pending review</SpvCardStatus>;
      case 'openingSoon':
        return <SpvCardStatus>Data room opens soon</SpvCardStatus>;
      case 'rejected':
        return <SpvCardStatus>Data room access not approved</SpvCardStatus>;
      default:
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
        // Production opens Privy. Signing in with the invited email lands as an
        // invited viewer; the preview bar covers the other outcomes.
        onSignIn={() => setViewer('invited')}
      />

      <div className={clsx(d.root, s.root)}>
        <div className={clsx(d.content, s.contentTight)}>
          <SpvHero
            variant={variant}
            title={mockSpotlight.title}
            description={mockSpotlight.description}
            profileComplete={profileComplete}
            onEditProfile={() => setProfileOpen(true)}
            email={profile.contacts.email}
            supportEmail={mockSpotlight.supportEmail}
            onSignIn={() => setViewer('invited')}
            onSignOut={() => setViewer('signedOut')}
          />

          {/* The team is only for invited viewers: a locked page shows nothing
              of the deal (2026-10-01; earlier it was public directory info). */}
          {!locked && (
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
          )}

          {/* Explore PL Network stays on the page, in its big version for
              everyone: the KPIs and focus areas give a snapshot of the network
              (review 2026-10-02 — it started as the locked page's version). */}
          <section className={s.exploreSection} aria-label="Explore the PL Network">
            <SpvExploreTile featured />
          </section>

          {!locked && (
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
          )}

          <footer className={d.footer}>
            <div className={d.note}>
              © 2026 Protocol Labs.{' '}
              {locked
                ? ''
                : 'All content is provided by the founders. Protocol Labs does not endorse or recommend any investment, and is not a broker, dealer, or advisor. '}
              Questions? Write to{' '}
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

      {/* The request flow, behind the flag. */}
      {REQUEST_FLOW_ENABLED && (
        <>
          <SpvApplyModal
            key={viewer}
            isOpen={applyOpen}
            onClose={() => setApplyOpen(false)}
            spotlightTitle={netholabs.name}
            prefill={viewer === 'notApplied' ? mockSignedInUser : null}
            onSubmitted={(email) => {
              setApplyOpen(false);
              setAppliedEmail(email);
            }}
            onSignIn={(email) => {
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
        </>
      )}

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
