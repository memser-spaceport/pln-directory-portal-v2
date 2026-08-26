'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { deriveProgressSteps, type DerivedStepPhase } from '@/services/agent-sessions/deriveProgressSteps';
import { canDeleteFeatureEnv, canDeployFeatureEnv } from '@/services/agent-sessions/featureEnvActions';
import { WAITING_FOR_INPUT_STATUS } from '@/services/agent-sessions/constants';
import type { AgentSession, AgentSessionMessage } from '@/services/agent-sessions/agent-sessions.service';
import { formatDate, humanizeStatus, SessionStatusBadge } from '@/components/page/agent-sessions/shared/sessionStatus';
import s from '@/components/page/agent-sessions/shared/AgentSessions.module.scss';

import { AgentSessionChatMock, useComposerDraft } from './AgentSessionChatMock';
import {
  getScenario,
  MOCK_SESSION_ID,
  RESUMED_REPLY_BODY,
  RETRY_REPLY_BODY,
  scenarios,
  type ScenarioKey,
} from './mocks';
import proto from './AgentSessionChatPrototype.module.scss';

/**
 * Copy-simplify of `components/page/agent-sessions/AgentSessionDetailPage` —
 * /pl-infra/agent-sessions/<id>.
 *
 * Copied rather than imported because the original is four react-query hooks deep
 * (session, progress, deploy, delete) and gates on real RBAC. Structure, class names
 * and copy are transcribed verbatim; the styles are the production module imported
 * read-only. Simplifications, all local-state only:
 *
 * - `featureEnvUrlFromProgress` is dropped — the mocked sessions carry
 *   `feature_environment_url` directly, which is the branch it resolves to anyway.
 * - Loading and request-error branches are dropped; neither can occur here.
 * - `canAdmin` comes from the View-as switch instead of `usePermissions`.
 */

type DetailTab = 'overview' | 'chat';

/**
 * The tab bar had `role="tablist"` and none of the behaviour that role promises —
 * verified in the browser: 0 `tabpanel`s, 0 `aria-controls`, both tabs in the tab
 * order, and arrow keys doing nothing. This is the WAI-ARIA pattern: one stop in
 * the tab order, arrows to move between tabs, and each tab wired to its panel.
 */
const TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'chat', label: 'Chat' },
];

const STEP_DOT_CLASS: Record<DerivedStepPhase, string> = {
  pending: '',
  active: s.stepDotActive,
  completed: s.stepDotCompleted,
  failed: s.stepDotFailed,
  cancelled: s.stepDotFailed,
  skipped: s.stepDotSkipped,
};

/**
 * The progress list used to print `humanizeStatus(step.key)`, which turns
 * `pr_created` into "Pr created" — two rows under a badge saying "PR created", on
 * the same page, about the same event. `humanizeStatus` is a *fallback* for
 * vocabulary nobody has seen yet; step keys are a closed set the orchestrator
 * defines, so they get written out. Anything new still degrades through
 * `humanizeStatus` rather than disappearing.
 *
 * Named for the milestone the orchestrator actually emits, so the row for
 * `pr_created` and the badge for `pr_created` are the same three words.
 */
const STEP_LABELS: Record<string, string> = {
  session_created: 'Session created',
  repo_cloned: 'Repository cloned',
  code_change_started: 'Code change started',
  tests_run: 'Tests run',
  branch_pushed: 'Branch pushed',
  pr_created: 'PR created',
  feature_job_created: 'Feature environment dispatched',
  feature_ready: 'Feature environment ready',
};

/**
 * The phase, in words, so the coloured dot is not the only thing carrying it
 * (WCAG 1.4.1). It replaces `step.displayStatus`, which printed the raw task status
 * at event time — lowercase wire values like `completed` and `pushing` sitting next
 * to properly-written labels.
 */
const PHASE_LABELS: Record<DerivedStepPhase, string> = {
  pending: 'Pending',
  active: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
};

/** `https://pr-2791.dev.plnetwork.io` -> `pr-2791.dev.plnetwork.io`. */
function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const PHASE_TEXT_CLASS: Record<DerivedStepPhase, string> = {
  pending: '',
  active: proto.stepPhaseActive,
  completed: '',
  failed: proto.stepPhaseFailed,
  cancelled: proto.stepPhaseFailed,
  skipped: '',
};

export default function AgentSessionChatPrototype() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('waiting_for_input');
  const [canAdmin, setCanAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('chat');

  const scenario = getScenario(scenarioKey);
  const [session, setSession] = useState<AgentSession>(scenario.session);
  const [messages, setMessages] = useState<AgentSessionMessage[]>(scenario.messages);
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Deleting a feature environment asks first — in the page, not in a `confirm()`.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Announced, not shown: the deploy / delete result is already visible in the meta
  // grid, so this exists only for the reader who can't see it change.
  const [envAnnouncement, setEnvAnnouncement] = useState('');

  // Lives here, not in the composer: switching to Overview unmounts the chat pane,
  // and the whole point is that a half-written reply survives that. Backed by
  // localStorage, so it survives a reload too.
  const { draft, setDraft, clearDraft, draftRestored } = useComposerDraft(MOCK_SESSION_ID);

  const tabRefs = useRef<Partial<Record<DetailTab, HTMLButtonElement | null>>>({});
  const confirmDeleteRef = useRef<HTMLButtonElement | null>(null);
  const envStatusRef = useRef<HTMLParagraphElement | null>(null);

  // `formatDate` renders through `toLocaleString`, whose output depends on the
  // runtime locale and timezone — server and browser disagree. Prototype routes are
  // server-rendered, so the whole page is held back until mount to keep SSR and the
  // first client render identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const selectScenario = (key: ScenarioKey) => {
    clearTimers();
    const next = getScenario(key);
    setScenarioKey(key);
    setSession(next.session);
    setMessages(next.messages);
    setIsSending(false);
    setBusy(false);
    setActionError(null);
    setConfirmingDelete(false);
    setEnvAnnouncement('');
  };

  const derivedSteps = useMemo(
    () => deriveProgressSteps(scenario.steps, session.status),
    [scenario.steps, session.status],
  );
  const featureEnvUrl = session.feature_environment_url;

  /**
   * Stands in for `POST /messages`, which returns 202 and starts a fresh execution.
   * The point being demonstrated is that answering a question un-blocks the run, so
   * the status leaves `waiting_for_input` the moment the reply lands.
   */
  const handleSend = (body: string) => {
    const sentAt = new Date().toISOString();
    // The draft has left the composer and become a message — this is the one moment
    // it's safe to drop, and it has to be dropped or it restores on the next visit.
    clearDraft();
    setMessages((current) => [
      ...current,
      {
        id: `msg-local-${current.length + 1}`,
        task_id: MOCK_SESSION_ID,
        execution_id: 'exec-local',
        sender: 'admin',
        message_type: 'instruction',
        body,
        created_at: sentAt,
      },
    ]);
    setIsSending(true);
    setSession((current) => ({ ...current, status: 'running', error_message: null, updated_at: sentAt }));

    later(() => {
      setIsSending(false);
      setMessages((current) => [
        ...current,
        {
          id: `msg-local-agent-${current.length + 1}`,
          task_id: MOCK_SESSION_ID,
          execution_id: 'exec-local',
          sender: 'agent',
          message_type: 'reply',
          body: RESUMED_REPLY_BODY,
          created_at: new Date().toISOString(),
        },
      ]);
    }, 1400);
  };

  /**
   * Stands in for re-dispatching the orchestrator job with the same prompt and
   * branch. A failed run previously offered nothing at all — the page just showed a
   * red sentence and a composer.
   */
  const handleRetry = () => {
    const at = new Date().toISOString();
    setSession((current) => ({ ...current, status: 'running', error_code: null, error_message: null, updated_at: at }));
    later(() => {
      setMessages((current) => [
        ...current,
        {
          id: `msg-retry-${current.length + 1}`,
          task_id: MOCK_SESSION_ID,
          execution_id: 'exec-retry',
          sender: 'agent',
          message_type: 'reply',
          body: RETRY_REPLY_BODY,
          created_at: new Date().toISOString(),
        },
      ]);
    }, 1200);
  };

  const handleDeploy = () => {
    setActionError(null);
    setEnvAnnouncement('');
    setBusy(true);
    setSession((current) => ({ ...current, feature_environment_status: 'dispatched' }));
    later(() => {
      setBusy(false);
      setSession((current) => ({
        ...current,
        feature_environment_status: 'ready',
        feature_environment_name: 'pr-2791',
        feature_environment_url: 'https://pr-2791.dev.plnetwork.io',
      }));
      setEnvAnnouncement('Feature environment deployed and live.');
    }, 1600);
  };

  /**
   * Runs after the inline confirmation, which replaces `window.confirm`. A native
   * dialog is the one piece of chrome in this page nobody designed: it wears the
   * browser's font, ignores the focus ring the rest of the page just fixed, and its
   * two buttons are "OK" and "Cancel" — neither of which names the destructive one.
   *
   * The confirmation is inline rather than a dialog because there is exactly one
   * question and the row it replaces is already on screen; a modal for a yes/no on a
   * visible control is the heavier answer to a lighter problem.
   */
  const handleDelete = () => {
    setConfirmingDelete(false);
    setActionError(null);
    setEnvAnnouncement('');
    setBusy(true);
    setSession((current) => ({ ...current, feature_environment_status: 'deleting' }));
    // Both buttons in this row unmount while the delete is in flight — `deleting`
    // is neither deployable nor a state you can delete again — so focus has to be
    // handed somewhere real before that happens, or it falls to `<body>`.
    envStatusRef.current?.focus({ preventScroll: true });
    later(() => {
      setBusy(false);
      setSession((current) => ({
        ...current,
        feature_environment_status: 'deleted',
        feature_environment_url: null,
      }));
      setEnvAnnouncement('Feature environment deleted. The pull request and branch are kept.');
    }, 1200);
  };

  const setRole = (admin: boolean) => {
    setCanAdmin(admin);
    // A viewer has no tab bar at all, so a viewer left on the chat tab would be
    // stranded on a pane with no way back.
    if (!admin) setActiveTab('overview');
    setConfirmingDelete(false);
  };

  const showChat = canAdmin && activeTab === 'chat';

  // The question is the whole point of the confirmation, so the answer is where
  // focus goes — a keyboard user should not have to hunt for the button that just
  // appeared under their cursor.
  useEffect(() => {
    if (confirmingDelete) confirmDeleteRef.current?.focus();
  }, [confirmingDelete]);

  /**
   * "Answer the agent" lives on Overview; the composer lives on Chat. Switching
   * tabs unmounts one pane and mounts the other, so the textarea does not exist
   * yet when the click handler runs. `flushSync` commits the tab change before the
   * next line instead of parking the intent in state and chasing it in an effect —
   * one press, one action, and the caret is in the field it just opened.
   */
  const answerInChat = () => {
    flushSync(() => setActiveTab('chat'));
    document.getElementById('agent-session-message')?.focus();
  };

  if (!mounted) return <div className={s.pageFrame} />;

  return (
    // `focusRing` is scoped here because the app ships a global
    // `button { outline: none }` that erases the focus indicator on every button.
    <div className={`${s.pageFrame} ${proto.focusRing}`}>
      <div className={s.content}>
        {/* Prototype-only chrome. Nothing below this block exists on the real page. */}
        <div className={proto.switcher}>
          <div className={proto.switcherRow}>
            <span className={proto.switcherLabel}>Session state</span>
            <div className={proto.segmented} role="group" aria-label="Session state">
              {scenarios.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  data-active={item.key === scenarioKey}
                  aria-pressed={item.key === scenarioKey}
                  onClick={() => selectScenario(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={proto.switcherRow}>
            <span className={proto.switcherLabel}>View as</span>
            <div className={proto.segmented} role="group" aria-label="View as">
              <button type="button" data-active={canAdmin} aria-pressed={canAdmin} onClick={() => setRole(true)}>
                Admin
              </button>
              <button type="button" data-active={!canAdmin} aria-pressed={!canAdmin} onClick={() => setRole(false)}>
                Viewer
              </button>
            </div>
          </div>

          <p className={proto.switcherNote}>{scenario.note}</p>
        </div>

        {/* Back link, identity and tabs travel together: the tabs are page chrome,
            and leaving them to scroll out from under a pinned title reads as broken. */}
        <div className={s.stickyHeader}>
          <span className={s.backLink}>
            <ChevronLeftIcon /> Back to sessions
          </span>

          <div className={s.header}>
            <div className={s.titleBlock}>
              <h1 className={s.title}>Agent Session</h1>
              <p className={s.description}>{MOCK_SESSION_ID}</p>
            </div>
            <SessionStatusBadge status={session.status} />
          </div>

          {/* Chat is admin-only: a message starts a new agent run, so a VIEW-only
              user gets no tab bar at all rather than a read-only thread. */}
          {canAdmin ? (
            <div className={s.tabs} role="tablist" aria-label="Session detail">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`session-tab-${key}`}
                  aria-selected={activeTab === key}
                  aria-controls={`session-panel-${key}`}
                  // Roving tabindex: the tab bar is one stop in the page's tab
                  // order, and arrows move within it.
                  tabIndex={activeTab === key ? 0 : -1}
                  ref={(node) => {
                    tabRefs.current[key] = node;
                  }}
                  className={`${s.tab} ${proto.tab} ${activeTab === key ? `${s.tabActive} ${proto.tabActive}` : ''}`}
                  onClick={() => setActiveTab(key)}
                  onKeyDown={(event) => {
                    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                    if (!delta) return;
                    event.preventDefault();
                    // Move relative to the tab the key landed on — `key`, not
                    // `activeTab`. Those differ the moment focus is on a tab that
                    // isn't the selected one, which is most of the time in a
                    // roving-tabindex bar.
                    const index = TABS.findIndex((tab) => tab.key === key);
                    const next = TABS[(index + delta + TABS.length) % TABS.length].key;
                    setActiveTab(next);
                    tabRefs.current[next]?.focus();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {showChat ? (
          <div role="tabpanel" id="session-panel-chat" aria-labelledby="session-tab-chat">
            <AgentSessionChatMock
              session={session}
              messages={messages}
              isSending={isSending}
              onSend={handleSend}
              onRetry={handleRetry}
              draft={draft}
              onDraftChange={setDraft}
              draftRestored={draftRestored}
            />
          </div>
        ) : null}

        {!showChat ? (
          <div
            role={canAdmin ? 'tabpanel' : undefined}
            id={canAdmin ? 'session-panel-overview' : undefined}
            aria-labelledby={canAdmin ? 'session-tab-overview' : undefined}
            className={proto.overviewPanel}
          >
            {/* The composer lives on the Chat tab, so on this one a blocked run has
                a badge saying it is blocked and no way to unblock it. This is the
                route, and it is the only thing on the pane that can act.

                The tint, border and text are the exact values production spent on
                `.waitingBanner` — the banner the chat pane retired (deviation 2),
                because there the composer sits three inches below it wearing the
                same amber. Here there is no composer to defer to. */}
            {canAdmin && session.status === WAITING_FOR_INPUT_STATUS ? (
              <div className={proto.waitingRow}>
                <p className={proto.waitingText}>
                  The run is stopped until you reply — the agent will not continue on its own.
                </p>
                <button type="button" className={`${s.primaryButton} ${proto.waitingAction}`} onClick={answerInChat}>
                  Answer in Chat
                </button>
              </div>
            ) : null}

            <div className={s.panel}>
              <h2 className={s.sectionTitle}>Overview</h2>
              <div className={s.metaGrid}>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Repository</span>
                  <span className={s.metaValue}>{session.repository_key}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Base branch</span>
                  <span className={s.metaValue}>{session.base_branch}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Working branch</span>
                  <span className={s.metaValue}>{session.working_branch || '—'}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Requested by</span>
                  <span className={s.metaValue}>{session.requested_by || '—'}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Created</span>
                  <span className={s.metaValue}>{formatDate(session.created_at)}</span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Updated</span>
                  <span className={s.metaValue}>{formatDate(session.updated_at)}</span>
                </div>
                {/* Both of these printed their raw href. In a two-column grid a
                    62-character GitHub URL wraps to three lines and buries the one
                    part anybody reads it for — and the number was already on the
                    session as `pull_request_number`, rendered nowhere. The full URL
                    stays on hover, and in the browser's status bar, which is where
                    a link's address belongs. */}
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Pull request</span>
                  <span className={s.metaValue}>
                    {session.pull_request_url ? (
                      <a
                        className={`${s.externalLink} ${proto.externalLink}`}
                        href={session.pull_request_url}
                        target="_blank"
                        rel="noreferrer"
                        title={session.pull_request_url}
                      >
                        {session.pull_request_number ? `#${session.pull_request_number}` : 'Open pull request'}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Feature environment</span>
                  <span className={s.metaValue}>
                    {featureEnvUrl ? (
                      <a
                        className={`${s.externalLink} ${proto.externalLink}`}
                        href={featureEnvUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={featureEnvUrl}
                      >
                        {hostOf(featureEnvUrl)}
                      </a>
                    ) : session.feature_environment_status ? (
                      // Same vocabulary as the session status, so it gets the same
                      // treatment rather than a bare `dispatched` string.
                      <SessionStatusBadge status={session.feature_environment_status} />
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </div>

              {canAdmin ? (
                <div className={s.featureEnvActions}>
                  {confirmingDelete ? (
                    // The question replaces the row it was asked from, rather than
                    // covering the page with a dialog: one yes/no about a control
                    // that is already on screen. Escape backs out, the same as a
                    // dialog would.
                    <div
                      className={proto.confirmRow}
                      role="group"
                      aria-label="Confirm deleting the feature environment"
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setConfirmingDelete(false);
                      }}
                    >
                      <span className={proto.confirmText}>
                        Delete <strong>{session.feature_environment_name || 'this feature environment'}</strong>? The
                        pull request and branch are kept.
                      </span>
                      <button
                        type="button"
                        ref={confirmDeleteRef}
                        className={s.dangerButton}
                        disabled={busy}
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                      <button type="button" className={proto.quietButton} onClick={() => setConfirmingDelete(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {canDeployFeatureEnv(session) ? (
                        <button type="button" className={s.primaryButton} disabled={busy} onClick={handleDeploy}>
                          {busy && session.feature_environment_status === 'dispatched'
                            ? 'Deploying…'
                            : session.feature_environment_status === 'ready'
                              ? 'Redeploy feature env'
                              : 'Deploy feature env'}
                        </button>
                      ) : null}
                      {canDeleteFeatureEnv(session) ? (
                        <button
                          type="button"
                          className={s.dangerButton}
                          disabled={busy}
                          onClick={() => setConfirmingDelete(true)}
                        >
                          {busy && session.feature_environment_status === 'deleting'
                            ? 'Deleting…'
                            : 'Delete feature env'}
                        </button>
                      ) : null}
                      {!session.pull_request_url ? (
                        <span className={s.muted}>Feature env actions unlock after the PR is created.</span>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}

              {/* Screen-reader only, and deliberately so: the deploy / delete result
                  is already visible three rows up, in the meta grid. What was
                  missing is that a change nobody triggered a page load for was
                  announced to nobody. It doubles as somewhere for focus to land
                  when the button that was pressed unmounts. */}
              {canAdmin ? (
                <p className={proto.srOnly} role="status" tabIndex={-1} ref={envStatusRef}>
                  {envAnnouncement}
                </p>
              ) : null}

              {actionError ? <p className={`${s.state} ${s.error}`}>{actionError}</p> : null}
              {session.error_message ? <p className={`${s.state} ${s.error}`}>{session.error_message}</p> : null}

              <h2 className={s.sectionTitle}>Prompt</h2>
              <pre className={s.promptBox}>{session.prompt}</pre>
            </div>

            <div className={s.panel}>
              <h2 className={s.sectionTitle}>Progress</h2>
              {derivedSteps.length ? (
                <ol className={s.steps}>
                  {derivedSteps.map((step) => (
                    <li key={step.key} className={s.step}>
                      <span className={`${s.stepDot} ${STEP_DOT_CLASS[step.phase]}`} aria-hidden />
                      <div className={s.stepBody}>
                        {/* Written labels and a written phase. The old line was
                            `humanizeStatus(step.key) · step.displayStatus`, which
                            printed "Pr created · completed" two rows under a badge
                            reading "PR created" — one page, one event, two
                            vocabularies. See STEP_LABELS / PHASE_LABELS. */}
                        <span className={s.stepKey}>
                          {STEP_LABELS[step.key] ?? humanizeStatus(step.key)}{' '}
                          <span className={`${proto.stepPhase} ${PHASE_TEXT_CLASS[step.phase]}`}>
                            · {PHASE_LABELS[step.phase]}
                          </span>
                        </span>
                        {step.message ? <span className={s.stepMessage}>{step.message}</span> : null}
                        {step.createdAt ? (
                          <span className={`${s.stepMeta} ${proto.stepMeta}`}>{formatDate(step.createdAt)}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={s.state}>No progress events yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const ChevronLeftIcon = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 14.5L5 8.5L11 2.5" stroke="#156FF7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
