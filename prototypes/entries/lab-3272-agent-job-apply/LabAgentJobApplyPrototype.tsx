'use client';

/**
 * LAB-3272: the LabOS agent drafts a job application (v0 flow, mocked).
 *
 * The page is production's job opening page (JobOpeningView layout, imported SCSS) with the job board
 * prototype's mocked JobDetailPane. Apply opens the LabOS agent (home-v2-b AgentPanel, docked like
 * homepage's Agent V0). The agent offers a draft from the post and the profile, the member edits it in
 * the card or by asking, fills profile gaps from a resume, then sends in LabOS or copies it for the
 * team's own site. "Write it myself" opens the existing apply flow (job board JobApplyFlowDrawer).
 *
 * States for review: ?state=page|offer|draft|gap|edit|sent|external. Mock data only.
 */

import clsx from 'clsx';
import { Briefcase } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BackButton } from '@/components/ui/BackButton';
import { CheckIcon } from '@/components/icons';
import { formatRelativeDays, getJobDate, seniorityDisplayLabel } from '@/utils/jobs.utils';

import page from '@/components/page/jobs/JobOpeningView/JobOpeningView.module.scss';
import rr from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import btn from '@/components/common/Button/Button.module.scss';

import { AgentPanel } from '../home-v2-b/AgentPanel';
import type { AgentReply } from '../home-v2-b/agentScript';
import agentCss from '../home-v2-b/AgentPanel.module.scss';
import v0 from '../home-v2-agent-dock/AgentV0.module.scss';
import { JobDetailPane } from '../job-board/JobDetailPane';
import { JobApplyFlowDrawer, type ApplyFlowStepId } from '../job-board/JobApplyFlowDrawer';
import { JOB_ASPIRANT_PROFILE, type MemberProfile } from '../job-board/viewerState';
import js from '../job-board/JobReferRoleRow.module.scss';
import proto from '../agent-session-chat/AgentSessionChatPrototype.module.scss';

import {
  DRAFT_PROMPT,
  EDIT_PROMPT,
  GAP_PROMPT,
  applyPrompt,
  createApplyScript,
  type ApplyHooks,
  type DraftStatus,
} from './applyAgent';
import { APPLY_ROLES, MOCK_MEMBER, type ApplyRoute } from './mocks';
import s from './LabAgentJobApply.module.scss';

type StateKey = 'page' | 'offer' | 'draft' | 'gap' | 'edit' | 'sent' | 'external';

const STATES: { key: StateKey; label: string; note: string }[] = [
  { key: 'page', label: 'Job page', note: 'The member reads the job. Press Apply to start.' },
  { key: 'offer', label: 'Offer', note: 'Apply opens the agent. It offers a draft from the post and the profile.' },
  {
    key: 'draft',
    label: 'Draft',
    note: 'The draft is editable in the card. The agent also offers to fill two profile gaps.',
  },
  {
    key: 'gap',
    label: 'Profile gap',
    note: 'The agent read the resume and proposes three profile changes (mocked MCP profile tools).',
  },
  {
    key: 'edit',
    label: 'Edit',
    note: 'The member asked for a change. The new draft replaces the old one, which folds to a quote.',
  },
  { key: 'sent', label: 'Sent', note: 'Sent in LabOS. The card is the receipt, and the page shows Applied.' },
  {
    key: 'external',
    label: 'External copy',
    note: 'This role takes applications on the team’s site only. The draft is copied for their form.',
  },
];

type Seed = { text: string; opts?: { settled?: boolean; gapUploaded?: boolean; lastStatus?: DraftStatus } };

function seedsFor(state: StateKey, apply: string): Seed[] {
  const offer: Seed = { text: apply, opts: { settled: state !== 'offer' } };
  switch (state) {
    case 'page':
      return [];
    case 'offer':
      return [offer];
    case 'draft':
      return [offer, { text: DRAFT_PROMPT }];
    case 'gap':
      return [offer, { text: DRAFT_PROMPT, opts: { gapUploaded: true } }, { text: GAP_PROMPT }];
    case 'edit':
      return [offer, { text: DRAFT_PROMPT }, { text: EDIT_PROMPT }];
    case 'sent':
      return [offer, { text: DRAFT_PROMPT }, { text: EDIT_PROMPT, opts: { lastStatus: 'sent' } }];
    case 'external':
      return [offer, { text: DRAFT_PROMPT, opts: { lastStatus: 'copied' } }];
  }
}

function readParams(): { state: StateKey; route: ApplyRoute } {
  const p = new URLSearchParams(window.location.search);
  const raw = p.get('state') as StateKey | null;
  const state = STATES.some((x) => x.key === raw) ? (raw as StateKey) : 'page';
  const route: ApplyRoute = state === 'external' || p.get('role') === 'external' ? 'external' : 'labos';
  return { state, route };
}

function writeParams(state: StateKey, route: ApplyRoute) {
  const url = new URL(window.location.href);
  url.searchParams.set('state', state);
  if (route === 'external' && state !== 'external') url.searchParams.set('role', 'external');
  else url.searchParams.delete('role');
  window.history.replaceState(null, '', url.toString());
}

export default function LabAgentJobApplyPrototype() {
  /* Mount gate: dates and the URL are client-only (job board mocks use "now"). */
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<StateKey>('page');
  const [route, setRoute] = useState<ApplyRoute>('labos');
  /* A new key starts a new agent session (new script, new thread). */
  const [session, setSession] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [appliedAt, setAppliedAt] = useState<string | undefined>();
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<ApplyFlowStepId>('application');
  const [profile, setProfile] = useState<MemberProfile>(JOB_ASPIRANT_PROFILE);

  const go = useCallback((next: StateKey, nextRoute: ApplyRoute) => {
    setState(next);
    setRoute(nextRoute);
    setSession((n) => n + 1);
    setAgentOpen(next !== 'page');
    setFlowOpen(false);
    const sent = next === 'sent';
    setApplied(sent);
    setAppliedAt(sent ? new Date().toISOString() : undefined);
    writeParams(next, nextRoute);
  }, []);

  useEffect(() => {
    const p = readParams();
    setMounted(true);
    go(p.state, p.route);
  }, [go]);

  const a = APPLY_ROLES[route];

  const hooksRef = useRef<ApplyHooks>({ onSent: () => undefined, onWriteMyself: () => undefined });
  hooksRef.current = {
    onSent: () => {
      setApplied(true);
      setAppliedAt(new Date().toISOString());
    },
    onWriteMyself: () => {
      setAgentOpen(false);
      setFlowStep('application');
      setFlowOpen(true);
    },
  };

  /* The script and the seeded thread come from one instance, so later turns keep its draft history. */
  const { reply, thread } = useMemo(() => {
    const hooks: ApplyHooks = {
      onSent: () => hooksRef.current.onSent(),
      onWriteMyself: () => hooksRef.current.onWriteMyself(),
    };
    const script = createApplyScript(a, hooks);
    const seeds = seedsFor(state, applyPrompt(a));
    const built = seeds.map((seed): { text: string; reply: AgentReply } => ({
      text: seed.text,
      reply: script(seed.text, seed.opts),
    }));
    return { reply: (text: string) => script(text), thread: built };
    // `session` restarts the conversation on Apply and on a state switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, state, session]);

  const onApply = () => {
    setState('offer');
    setSession((n) => n + 1);
    setAgentOpen(true);
    writeParams('offer', route);
  };

  if (!mounted) return <div className={s.root} />;

  const { role, team } = a;
  const date = getJobDate(role);
  const meta = [role.seniority ? seniorityDisplayLabel(role.seniority) : null, role.location.join(', ')].filter(
    Boolean,
  );

  return (
    <div className={clsx(s.root, proto.focusRing)}>
      {/* Prototype-only chrome. Nothing in this block exists on the real page. */}
      <div className={clsx(s.chrome, agentOpen && s.pushed)}>
        <div className={proto.switcher}>
          <div className={proto.switcherRow}>
            <span className={proto.switcherLabel}>State</span>
            <div className={proto.segmented} role="group" aria-label="State">
              {STATES.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  data-active={x.key === state}
                  aria-pressed={x.key === state}
                  onClick={() => go(x.key, x.key === 'external' ? 'external' : x.key === 'page' ? route : 'labos')}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className={proto.switcherRow}>
            <span className={proto.switcherLabel}>Role</span>
            <div className={proto.segmented} role="group" aria-label="How the role takes applications">
              <button
                type="button"
                data-active={route === 'labos'}
                onClick={() => go(state === 'external' ? 'draft' : state, 'labos')}
              >
                Apply in LabOS
              </button>
              <button type="button" data-active={route === 'external'} onClick={() => go(state, 'external')}>
                Team’s site only
              </button>
            </div>
          </div>
          <p className={proto.switcherNote}>{STATES.find((x) => x.key === state)?.note}</p>
        </div>
      </div>

      <div className={clsx(page.page, s.page, agentOpen && s.pushed)}>
        <BackButton to="/prototypes/job-board" forceTo />
        <article className={page.article}>
          <JobDetailPane role={role} team={team} applied={applied} appliedAt={appliedAt} />
          <div className={page.actions}>
            <div className={clsx(rr.root, rr.row)}>
              <div className={rr.body}>
                <div className={rr.titleRow}>
                  <span className={rr.title}>{role.roleTitle}</span>
                </div>
                {meta.length > 0 && <div className={rr.meta}>{meta.join(' · ')}</div>}
              </div>
              <div className={clsx(rr.right, rr.actions)}>
                {date && !applied && (
                  <span className={clsx(rr.relative, js.relativeTone)}>{formatRelativeDays(date)}</span>
                )}
                {applied ? (
                  <button
                    type="button"
                    disabled
                    className={clsx(btn.root, btn.small, btn.border, btn.neutral, js.applyButton, js.appliedButton)}
                  >
                    <CheckIcon width={12} height={12} aria-hidden="true" />
                    Applied
                  </button>
                ) : (
                  <button
                    type="button"
                    className={clsx(btn.root, btn.small, btn.fill, btn.primary, js.applyButton)}
                    aria-label={`Apply to ${role.roleTitle}`}
                    onClick={onApply}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      <AgentPanel
        key={`${session}-${route}`}
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        initialThread={thread.length ? thread : undefined}
        reply={reply}
        greeting={`Hi ${MOCK_MEMBER.firstName}, what can I do for you?`}
        intro="I read this job and your profile. I ask before I send or change anything."
        prompts={[{ text: DRAFT_PROMPT, topic: 'job', primary: true }]}
        placeholder="Tell the agent what to change"
        className={v0.panelOnHome}
        contextSlot={
          <span className={agentCss.context} title="The agent reads this job post">
            <Briefcase weight="regular" size={14} />
            {role.roleTitle}
          </span>
        }
      />

      <JobApplyFlowDrawer
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        role={role}
        team={team}
        step={flowStep}
        onStepChange={setFlowStep}
        profile={profile}
        onSaveProfile={setProfile}
        onSubmitApplication={() => {
          setFlowOpen(false);
          setApplied(true);
          setAppliedAt(new Date().toISOString());
        }}
        onCreateAccount={() => undefined}
        loggedIn
        onSignIn={() => undefined}
        pendingApproval={false}
        jobAspirant
        applied={applied}
        appliedAt={appliedAt}
      />
    </div>
  );
}
