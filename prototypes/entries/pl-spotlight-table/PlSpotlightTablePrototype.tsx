'use client';

// PL Spotlight — back-office participants table.
// Recreated from Figma node 750:690 in "Back Office | Protocol Labs"
// (file r1B2INuN2xKR31z9oDQWWt).
//
// REUSE MAP
//  - CustomTooltip (@/components/ui/Tooltip/Tooltip) — import-safe, no data deps.
//    Used force-on for the three action buttons (the frame names them "Resend
//    Invite" / "Resend Follow-up" / "Remove participant" but shows icons only)
//    and in its default truncation-only mode for the clipped Template vars cell.
//  - InviteEmailModal (local) — the compose step behind the envelope button. Its
//    chrome is the portal's referral modal, not the back-office confirm sheet, so
//    it reaches into production for Modal / Button / FormField / FormTextArea.
//  - SpotlightOverview (local) — the record card the table belongs to,
//    transcribed from the back-office app's own Overview section. It keeps its
//    own reuse map and decision list.
//  - EmailTemplateModal (local) — behind the Overview's Email Template row.
//    Shares InviteEmailModal's chrome classes outright rather than copying them.
//  - BackOfficeNavbar (local) — the back-office top bar this screen sits under,
//    transcribed from the header component in the same Figma file (426:33970)
//    with its icons exported alongside the table's. It keeps its own reuse map
//    and decision list; nothing about it is invented that is not listed there.
//  - Everything else is hand-transcribed: the frame belongs to the back-office
//    app, not portal-v2, so there is no production component to import. The
//    checkbox and both dropdowns stay NATIVE — that is literally what the frame
//    renders (the browser's own 16px checkbox, and <select>s the canvas can only
//    draw as an empty pill + chevron).
//
// WHAT THE FRAME COULD NOT SHOW, AND SO WAS DECIDED HERE
//  - Type / Access option sets: production enums (INVESTOR | FOUNDER | SUPPORT,
//    L0–L6 | Rejected) rather than invented ones. See mocks.ts.
//  - Row hover, focus rings, an undo affordance for the destructive remove, and
//    a sticky header. All flagged in the stylesheet where they appear.
//  - The table frame is cropped to the table, so it does not say what sits above
//    it. The navbar renders OUTSIDE `.root` so it is full-bleed while the table
//    keeps its 24px gutter, and it is not sticky — the table already sticks its
//    own header row to the viewport, and one of the two has to give way.
//  - What the invite email says is now a property of the SPOTLIGHT, edited once
//    in the Overview card, rather than a constant in a module. Two consequences
//    the frame could not have shown: the send modal's draft is seeded from that
//    template, and the Overview's Title / Support Email feed the same draft's
//    `{{spotlight_title}}` / `{{support_email}}` — so renaming the spotlight
//    renames every subject line, live.

import { useMemo, useRef, useState } from 'react';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_LABELS,
  PARTICIPANT_TYPES,
  PARTICIPANT_TYPE_LABELS,
  SPOTLIGHT_CONTEXT,
  SPOTLIGHT_TODAY,
  mockSpotlightOverview,
  mockSpotlightParticipants,
} from './mocks';
import type {
  AccessLevel,
  InvestorType,
  ParticipantType,
  SpotlightOverview as SpotlightOverviewData,
  SpotlightParticipant,
} from './mocks';
import type { InviteTemplate } from './inviteTemplate';
import { DEFAULT_INVITE_TEMPLATE } from './inviteTemplate';
import {
  CheckIcon,
  ChevronDownIcon,
  CrossIcon,
  EnvelopeIcon,
  ExternalLinkIcon,
  ReplyIcon,
  TrashIcon,
} from './SpotlightIcons';
import InviteEmailModal from './InviteEmailModal';
import EmailTemplateModal from './EmailTemplateModal';
import SpotlightOverview from './SpotlightOverview';
import BackOfficeNavbar from './BackOfficeNavbar';
import s from './PlSpotlightTablePrototype.module.scss';

const BADGE_CLASS: Record<InvestorType, string> = {
  Angel: s.badgeAngel,
  Fund: s.badgeFund,
  'not provided': s.badgeUnknown,
};

type RemovedRow = { row: SpotlightParticipant; index: number };

export default function PlSpotlightTablePrototype() {
  const [rows, setRows] = useState<SpotlightParticipant[]>(mockSpotlightParticipants);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [lastRemoved, setLastRemoved] = useState<RemovedRow | null>(null);
  // The invite being composed. Open-ness is separate from the row so the card
  // still has a participant to render while the modal fades out; `session`
  // changes on every open, which is what re-mounts the compose form with a fresh
  // draft — including when the same row is opened twice.
  const [invite, setInvite] = useState<{ row: SpotlightParticipant; session: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteCount = useRef(0);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // The spotlight record and its invite wording. Both live here rather than in
  // the Overview card: the card edits them, but the table's send modal reads
  // them, so the state has to sit above both.
  const [overview, setOverview] = useState<SpotlightOverviewData>(mockSpotlightOverview);
  const [template, setTemplate] = useState<InviteTemplate>(DEFAULT_INVITE_TEMPLATE);
  const [templateOpen, setTemplateOpen] = useState(false);
  // Same re-mount trick the invite modal uses — a fresh session per open means
  // the editor always reopens on the saved template, never on a stale draft.
  const [templateSession, setTemplateSession] = useState(0);

  // What the template can interpolate. Closes and Sender Name are read live off
  // the Overview, so editing either rewrites every draft; the company's name and
  // description are properties of the company the spotlight is for, which the
  // Overview does not (and should not) edit.
  const inviteContext = useMemo(
    () => ({
      companyName: SPOTLIGHT_CONTEXT.companyName,
      companyBlurb: SPOTLIGHT_CONTEXT.companyBlurb,
      closeDate: overview.closesOn,
      senderName: overview.senderName,
    }),
    [overview.closesOn, overview.senderName],
  );

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  // The header checkbox's third state. Assigned during render via a callback ref
  // so it stays in sync without an effect.
  const setSelectAllRef = (node: HTMLInputElement | null) => {
    selectAllRef.current = node;
    if (node) {
      node.indeterminate = someSelected;
    }
  };

  const updateRow = (id: string, patch: Partial<SpotlightParticipant>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleToggleAll = () => {
    setSelectedIds(allSelected ? [] : rows.map((row) => row.id));
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]));
  };

  // The envelope no longer sends on click — it opens the compose step, which is
  // where the send actually happens. Nothing else about the row changes until
  // then, so a cancelled modal leaves the table exactly as it was.
  const handleOpenInvite = (row: SpotlightParticipant) => {
    inviteCount.current += 1;
    setInvite({ row, session: `${row.id}-${inviteCount.current}` });
    setInviteOpen(true);
  };

  const handleInviteSend = (row: SpotlightParticipant, email: { edited: boolean }) => {
    updateRow(row.id, { inviteSent: true });
    setLastRemoved(null);
    setStatus(
      `${row.inviteSent ? 'Invite resent' : 'Invite sent'} to ${row.email}${email.edited ? ' with an edited note' : ''}.`,
    );
    setInviteOpen(false);
  };

  const handleOverviewSave = (next: SpotlightOverviewData) => {
    setOverview(next);
    setLastRemoved(null);
    // Reports the two fields the invite actually reads, because those are the
    // edits with a consequence somewhere other than this card.
    setStatus(
      next.closesOn !== overview.closesOn
        ? `Spotlight now closes ${next.closesOn}. New invites say so.`
        : next.senderName !== overview.senderName
          ? `Invites now sign off as ${next.senderName || 'nobody — Sender Name is unset'}.`
          : 'Spotlight overview saved.',
    );
  };

  const handleOpenTemplate = () => {
    setTemplateSession((current) => current + 1);
    setTemplateOpen(true);
  };

  const handleTemplateSave = (next: InviteTemplate) => {
    setTemplate(next);
    setTemplateOpen(false);
    setLastRemoved(null);
    setStatus('Invite email template saved. Every new invite starts from it.');
  };

  const handleFollowUp = (row: SpotlightParticipant) => {
    const next = row.followUpsSent + 1;
    updateRow(row.id, { followUpsSent: next, followUpDate: SPOTLIGHT_TODAY });
    setLastRemoved(null);
    setStatus(`Follow-up ${next} sent to ${row.email}.`);
  };

  const handleRemove = (row: SpotlightParticipant) => {
    const index = rows.findIndex((candidate) => candidate.id === row.id);
    setRows((current) => current.filter((candidate) => candidate.id !== row.id));
    setSelectedIds((current) => current.filter((id) => id !== row.id));
    setLastRemoved({ row, index });
    setStatus(`${row.name} removed from PL Spotlight.`);
  };

  const handleUndoRemove = () => {
    if (!lastRemoved) return;
    setRows((current) => {
      const next = [...current];
      next.splice(lastRemoved.index, 0, lastRemoved.row);
      return next;
    });
    setStatus(`${lastRemoved.row.name} restored.`);
    setLastRemoved(null);
  };

  const selectionLabel = useMemo(() => {
    if (selectedIds.length === 0) return `${rows.length} participants`;
    return `${selectedIds.length} of ${rows.length} selected`;
  }, [rows.length, selectedIds.length]);

  return (
    <>
      {/* The back-office chrome this screen actually sits under. Rendered
          outside `.root` so the bar is full-bleed and the table keeps its
          24px gutter. */}
      <BackOfficeNavbar />

      <div className={s.root}>
        {/* The record the table is a list of. It leads because it answers what
            the spotlight is and how its mail is configured — including, now,
            what that mail actually says. */}
        <SpotlightOverview
          className={s.overview}
          overview={overview}
          onSave={handleOverviewSave}
          onEditTemplate={handleOpenTemplate}
        />

        <div className={s.card}>
          {/* The frame is 1486px wide, so anything narrower scrolls it. A scrollable
              region has to be reachable by keyboard, hence the tabIndex. */}
          <div className={s.scroller} role="region" aria-label="PL Spotlight participants table" tabIndex={0}>
            <div className={s.table} role="table" aria-label="PL Spotlight participants">
              <div className={`${s.headRow}`} role="row">
                <div className={`${s.headCell} ${s.colSelect}`} role="columnheader">
                  <input
                    ref={setSelectAllRef}
                    type="checkbox"
                    className={s.checkbox}
                    checked={allSelected}
                    onChange={handleToggleAll}
                    aria-label="Select all visible participants"
                  />
                </div>
                <div className={`${s.headCell} ${s.colMember}`} role="columnheader">
                  <span className={s.headLabel}>Member</span>
                </div>
                <div className={`${s.headCell} ${s.colTeam}`} role="columnheader">
                  <span className={s.headLabel}>Team</span>
                </div>
                <div className={`${s.headCell} ${s.colInvestorType}`} role="columnheader">
                  <span className={s.headLabel}>Investor Type</span>
                </div>
                <div className={`${s.headCell} ${s.colAccepted}`} role="columnheader">
                  <span className={s.headLabel}>Invite Accepted</span>
                </div>
                <div className={`${s.headCell} ${s.colFollowUp}`} role="columnheader">
                  <span className={s.headLabel}>Follow-up</span>
                </div>
                <div className={`${s.headCell} ${s.colTemplate}`} role="columnheader">
                  <span className={s.headLabel}>Template vars</span>
                </div>
                <div className={`${s.headCell} ${s.colType}`} role="columnheader">
                  <span className={s.headLabel}>Type</span>
                </div>
                <div className={`${s.headCell} ${s.colAccess}`} role="columnheader">
                  <span className={s.headLabel}>Access</span>
                </div>
                <div className={`${s.headCell} ${s.colActions}`} role="columnheader">
                  <span className={s.headLabel}>Actions</span>
                </div>
              </div>

              {rows.map((row) => (
                <div className={s.row} key={row.id} role="row">
                  <div className={`${s.cell} ${s.colSelect}`} role="cell">
                    <input
                      type="checkbox"
                      className={s.checkbox}
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleToggleRow(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </div>

                  <div className={`${s.cell} ${s.colMember}`} role="cell">
                    <div className={s.member}>
                      {row.avatarUrl ? (
                        <img className={s.avatar} src={row.avatarUrl} alt="" />
                      ) : row.avatarPlaceholder ? (
                        <span className={s.avatarPlaceholder} aria-hidden="true" />
                      ) : null}
                      <span className={s.memberText}>
                        <span className={s.memberName}>{row.name}</span>
                        <span className={s.memberEmail}>{row.email}</span>
                      </span>
                    </div>
                  </div>

                  <div className={`${s.cell} ${s.colTeam}`} role="cell">
                    {row.team ? (
                      // Mocked target: prototypes never link out to real records.
                      <a className={s.teamLink} href="#team" onClick={(event) => event.preventDefault()}>
                        <span className={s.teamName}>{row.team}</span>
                        <span className={s.teamLinkIcon}>
                          <ExternalLinkIcon />
                        </span>
                      </a>
                    ) : (
                      <span className={s.muted}>-</span>
                    )}
                  </div>

                  <div className={`${s.cell} ${s.colInvestorType}`} role="cell">
                    <span className={`${s.badge} ${BADGE_CLASS[row.investorType]}`}>{row.investorType}</span>
                  </div>

                  <div className={`${s.cell} ${s.colAccepted}`} role="cell">
                    <span className={s.acceptedIcon}>
                      {row.inviteAccepted ? <CheckIcon /> : <CrossIcon />}
                      <span className={s.srOnly}>{row.inviteAccepted ? 'Invite accepted' : 'Invite not accepted'}</span>
                    </span>
                  </div>

                  <div className={`${s.cell} ${s.colFollowUp}`} role="cell">
                    {row.followUpsSent > 0 ? (
                      <span className={s.followUp}>
                        <span className={s.followUpCount}>{row.followUpsSent} sent</span>
                        <span className={s.followUpDate}>{row.followUpDate}</span>
                      </span>
                    ) : (
                      <span className={s.muted}>—</span>
                    )}
                  </div>

                  <div className={`${s.cell} ${s.colTemplate}`} role="cell">
                    {row.templateVars ? (
                      <CustomTooltip
                        content={<span className={s.templateVarsTooltip}>{row.templateVars}</span>}
                        trigger={
                          <button type="button" className={s.templateVars}>
                            {row.templateVars}
                          </button>
                        }
                      />
                    ) : (
                      <span className={s.mutedRegular}>no data</span>
                    )}
                  </div>

                  <div className={`${s.cell} ${s.colType}`} role="cell">
                    <span className={`${s.selectWrap} ${s.selectType}`}>
                      <select
                        className={s.select}
                        value={row.participantType}
                        aria-label={`Type for ${row.name}`}
                        onChange={(event) =>
                          updateRow(row.id, { participantType: event.target.value as ParticipantType })
                        }
                      >
                        {PARTICIPANT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {PARTICIPANT_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      <span className={s.selectChevron}>
                        <ChevronDownIcon stroke="#6B21A8" />
                      </span>
                    </span>
                  </div>

                  <div className={`${s.cell} ${s.colAccess}`} role="cell">
                    <span className={`${s.selectWrap} ${s.selectAccess}`}>
                      <select
                        className={s.select}
                        value={row.accessLevel}
                        aria-label={`Access level for ${row.name}`}
                        onChange={(event) => updateRow(row.id, { accessLevel: event.target.value as AccessLevel })}
                      >
                        {ACCESS_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {ACCESS_LEVEL_LABELS[level]}
                          </option>
                        ))}
                      </select>
                      <span className={s.selectChevron}>
                        <ChevronDownIcon stroke="#1E40AF" />
                      </span>
                    </span>
                  </div>

                  <div className={`${s.cell} ${s.colActions}`} role="cell">
                    <div className={s.actions}>
                      <CustomTooltip
                        forceTooltip
                        content={row.inviteSent ? 'Resend Invite' : 'Send Invite'}
                        trigger={
                          <button
                            type="button"
                            className={s.actionButton}
                            aria-label={`${row.inviteSent ? 'Resend' : 'Send'} invite to ${row.name}`}
                            onClick={() => handleOpenInvite(row)}
                          >
                            <EnvelopeIcon />
                          </button>
                        }
                      />
                      <CustomTooltip
                        forceTooltip
                        content={row.followUpsSent > 0 ? 'Resend Follow-up' : 'Send Follow-up'}
                        trigger={
                          <button
                            type="button"
                            className={s.actionButton}
                            aria-label={`${row.followUpsSent > 0 ? 'Resend' : 'Send'} follow-up to ${row.name}`}
                            onClick={() => handleFollowUp(row)}
                          >
                            <ReplyIcon />
                          </button>
                        }
                      />
                      <CustomTooltip
                        forceTooltip
                        content="Remove participant"
                        trigger={
                          <button
                            type="button"
                            className={s.actionButton}
                            aria-label={`Remove ${row.name}`}
                            onClick={() => handleRemove(row)}
                          >
                            <TrashIcon />
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={s.statusBar}>
          <span role="status" aria-live="polite">
            {status}
          </span>
          {lastRemoved ? (
            <button type="button" className={s.statusUndo} onClick={handleUndoRemove}>
              Undo
            </button>
          ) : null}
          <span className={s.selectionCount}>{selectionLabel}</span>
        </div>

        <InviteEmailModal
          open={inviteOpen}
          row={invite?.row ?? null}
          template={template}
          context={inviteContext}
          session={invite?.session ?? ''}
          onClose={() => setInviteOpen(false)}
          onSend={handleInviteSend}
        />

        <EmailTemplateModal
          open={templateOpen}
          template={template}
          context={inviteContext}
          rows={rows}
          session={`template-${templateSession}`}
          onClose={() => setTemplateOpen(false)}
          onSave={handleTemplateSave}
        />
      </div>
    </>
  );
}
