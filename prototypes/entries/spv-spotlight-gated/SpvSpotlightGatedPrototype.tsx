'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CalendarBlankIcon } from '@/components/icons';
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
import {
  SpvInvestorProfileDrawer,
  hasInvestorProfile,
  type InvestorRecord,
  type SpvFund,
} from './SpvInvestorProfileDrawer';
import { SpvInvestorProfileCard } from './SpvInvestorProfileCard';
// The product's contact-support modal, as the help-menu prototype copies it.
import { SupportModal } from '../help-feedback-menu/SupportModal';
import { SpvApplyModal, SpvAppliedModal } from './SpvApplyModal';
import {
  mockSignedInUser,
  mockInvestorProfile,
  mockInvestorDetails,
  mockSpotlight,
  MOCK_FUNDS,
  INVESTOR_KIND_OPTIONS,
  type InvestorKind,
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
 *   Demo Day taught us — and the primary is **Access data room** (or **Request
 *   data room access**, switchable in the demo bar), a plain
 *   link to the team's DocSend (no DocSend integration).
 * - **Locked states.** Without the token and a login, the page shows nothing of
 *   the deal — no title, no team, no FAQ: a lock message with Sign in and
 *   Contact us, and **Explore PL Network as a bigger tile** so a visitor has
 *   somewhere to go. Signed in but not on the list (e.g. a forwarded link) is
 *   only "You don't have access" + Contact us: no other-account option and no
 *   email address (review 2026-10-05). Contact us opens the product's
 *   contact-support modal.
 * - **Investor profile ask** (review 2026-10-07): one sentence with a link,
 *   above the team card ("Set up your investor profile" for a new investor,
 *   "Review your investor profile" for one who has a profile). It was a card
 *   (2026-10-05). The link opens the investor-profile drawer, which matches
 *   production's Demo Day investor drawer. One drawer, no wizard.
 * - **Deadline** (review 2026-10-07): the close date and "allocation, minimum
 *   check and SPV terms are in the data room" under the team card's button.
 *   The data-room button repeats in a band above the FAQ (Charlotte's ask;
 *   removed on 2026-10-07, back 2026-10-08), with the SPV name and close date.
 * - The FAQ stays for invited viewers, rewritten for the token model.
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

// Two labels for the data-room button, compared in the demo bar (2026-10-08).
// "Access" is true on every visit (no DocSend integration, so the page can't
// tell whether access was already requested or granted); "Request" names the
// step a first visit starts (review 2026-10-02). The FAQ follows the choice.
const DATA_ROOM_LABELS = ['Access data room', 'Request data room access'] as const;
type DataRoomLabel = (typeof DATA_ROOM_LABELS)[number];

const HINTS: Record<SpvHeroVariant, string> = {
  lockedSignedOut: 'No token and not logged in: locked. Nothing of the deal shows, only Explore PL Network.',
  lockedNoAccess: 'Logged in, but not on this Spotlight’s invitation list: locked, no deal.',
  landing: 'Legacy request flow (flag on).',
  pending: 'Legacy request flow (flag on).',
  rejected: 'Legacy request flow (flag on).',
  openingSoon: 'Invited, Spotlight still in draft. No DocSend yet.',
  open: 'The token link logged them in: the button opens the DocSend (no integration, so one label for every visit).',
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
  const [investorKind, setInvestorKind] = useState<InvestorKind>('new');
  const [dataRoomLabel, setDataRoomLabel] = useState<DataRoomLabel>('Access data room');
  const [investor, setInvestor] = useState<InvestorRecord>(mockInvestorDetails.new);
  const [funds, setFunds] = useState<SpvFund[]>(MOCK_FUNDS);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.page} />;

  const isLoggedIn = viewer !== 'signedOut';
  // "Set up" until the investor has told us how they invest at all, then
  // "Review and update" (review 2026-10-05). Saving a profile in the drawer
  // flips a new investor over, as it would in production.
  const hasProfile = hasInvestorProfile(investor);
  // The legacy pending stepper's step 2 still reads this.
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
            // Picked in the demo bar: see DATA_ROOM_LABELS.
            label={dataRoomLabel}
            href={mockSpotlight.docSendUrl}
            // The deadline and where the terms are (review 2026-10-07).
            note={
              <>
                <span className={s.cardActionDeadline}>Closes {mockSpotlight.closesOn}</span>
                <span className={s.cardActionTerms}>Allocation, minimum check and SPV terms are inside.</span>
              </>
            }
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
        {/* Which investor is looking (review 2026-10-05). Only where the
            investor-profile card shows. */}
        {(variant === 'open' || variant === 'openingSoon') && (
          <>
            <span className={s.demoLabel}>Investor</span>
            <div className={s.segmented}>
              {INVESTOR_KIND_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={clsx(s.segment, { [s.segmentActive]: investorKind === o.value })}
                  onClick={() => {
                    setInvestorKind(o.value);
                    setInvestor(mockInvestorDetails[o.value]);
                    setFunds(MOCK_FUNDS);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
        {variant === 'open' && (
          <>
            <span className={s.demoLabel}>Button label</span>
            <div className={s.segmented}>
              {DATA_ROOM_LABELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={clsx(s.segment, { [s.segmentActive]: dataRoomLabel === l })}
                  onClick={() => setDataRoomLabel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
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
            onSignIn={() => setViewer('invited')}
            onContactUs={() => setSupportOpen(true)}
          />

          {/* One sentence with a link (Anuj, review 2026-10-07), above the team
              card: briefly after it, moved back above the same day. */}
          {(variant === 'open' || variant === 'openingSoon') && (
            <SpvInvestorProfileCard existing={hasProfile} onOpen={() => setProfileOpen(true)} />
          )}

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

          {/* The data-room button again before the FAQ, to drive click-through
              (Charlotte, review 2026-10-07; back 2026-10-08). Open state only. */}
          {variant === 'open' && (
            <section className={s.ctaBand} aria-label="Data room">
              {/* More in the band (2026-10-08), all facts the page already has:
                  the logo, who leads the SPV into which round (the Spotlight
                  description, the team's stage), what the data room holds,
                  and the close date. */}
              <img className={s.ctaBandLogo} src={netholabs.logoUrl} alt="" />
              <div className={s.ctaBandText}>
                <h2 className={s.ctaBandTitle}>{netholabs.name} SPV</h2>
                <p className={s.ctaBandBody}>
                  Protocol Labs is leading an SPV into the {netholabs.name}{' '}
                  {(netholabs.team.fundingStage?.title ?? '').toLowerCase()} round. The pitch, allocation, minimum check
                  and SPV terms are in the data room.
                </p>
                <p className={s.ctaBandMeta}>
                  <CalendarBlankIcon width={16} height={16} aria-hidden />
                  Closes {mockSpotlight.closesOn}
                </p>
              </div>
              <SpvCardAction label={dataRoomLabel} href={mockSpotlight.docSendUrl} />
            </section>
          )}

          {!locked && (
            <section className={d.sectionFaq}>
              <FAQ
                title="Questions investors ask"
                // The FAQ names the button, so it follows the label switch.
                items={spvFaqItems.map((item) =>
                  typeof item.answer === 'string'
                    ? { ...item, answer: item.answer.replace('Access data room', dataRoomLabel) }
                    : item,
                )}
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
              © 2026 Protocol Labs.
              {/* Locked pages carry no address: Contact us above is the way to
                  ask (review 2026-10-05). */}
              {!locked && (
                <>
                  {' '}
                  All content is provided by the founders. Protocol Labs does not endorse or recommend any investment,
                  and is not a broker, dealer, or advisor. Questions? Write to{' '}
                  <a href={`mailto:${mockSpotlight.supportEmail}`} className={d.infoLink}>
                    {mockSpotlight.supportEmail}
                  </a>
                  .
                </>
              )}
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
        funds={funds}
        onFundsChange={setFunds}
        onContactSupport={() => setSupportOpen(true)}
      />

      <SupportModal
        open={supportOpen}
        initialTopic="Contact support"
        // Signed out, the fields start empty (production prefills only what it knows).
        viewer={isLoggedIn ? { name: profile.name, email: profile.contacts.email } : { name: '', email: '' }}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}
