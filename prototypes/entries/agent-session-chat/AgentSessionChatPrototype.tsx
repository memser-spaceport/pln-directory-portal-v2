'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { deriveProgressSteps, type DerivedStepPhase } from '@/services/agent-sessions/deriveProgressSteps';
import { canDeleteFeatureEnv, canDeployFeatureEnv } from '@/services/agent-sessions/featureEnvActions';
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

  // Lives here, not in the composer: switching to Overview unmounts the chat pane,
  // and the whole point is that a half-written reply survives that. Backed by
  // localStorage, so it survives a reload too.
  const { draft, setDraft, clearDraft, draftRestored } = useComposerDraft(MOCK_SESSION_ID);

  const tabRefs = useRef<Partial<Record<DetailTab, HTMLButtonElement | null>>>({});

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
    }, 1600);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this feature environment? The PR and branch will be kept.')) {
      return;
    }
    setActionError(null);
    setBusy(true);
    setSession((current) => ({ ...current, feature_environment_status: 'deleting' }));
    later(() => {
      setBusy(false);
      setSession((current) => ({
        ...current,
        feature_environment_status: 'deleted',
        feature_environment_url: null,
      }));
    }, 1200);
  };

  const setRole = (admin: boolean) => {
    setCanAdmin(admin);
    // A viewer has no tab bar at all, so a viewer left on the chat tab would be
    // stranded on a pane with no way back.
    if (!admin) setActiveTab('overview');
  };

  if (!mounted) return <div className={s.pageFrame} />;

  const showChat = canAdmin && activeTab === 'chat';

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
                <div className={s.metaItem}>
                  <span className={s.metaLabel}>Pull request</span>
                  <span className={s.metaValue}>
                    {session.pull_request_url ? (
                      <a className={s.externalLink} href={session.pull_request_url} target="_blank" rel="noreferrer">
                        {session.pull_request_url}
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
                      <a className={s.externalLink} href={featureEnvUrl} target="_blank" rel="noreferrer">
                        {featureEnvUrl}
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
                    <button type="button" className={s.dangerButton} disabled={busy} onClick={handleDelete}>
                      {busy && session.feature_environment_status === 'deleting' ? 'Deleting…' : 'Delete feature env'}
                    </button>
                  ) : null}
                  {!session.pull_request_url ? (
                    <span className={s.muted}>Feature env actions unlock after the PR is created.</span>
                  ) : null}
                </div>
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
                        {/* `humanizeStatus`, not `replace(/_/g, ' ')`. The badge
                            vocabulary in sessionStatus.tsx deliberately stopped
                            printing raw API values; the progress list still did,
                            so the two disagreed on the same page. */}
                        <span className={s.stepKey}>
                          {humanizeStatus(step.key)} · {step.displayStatus}
                        </span>
                        {step.message ? <span className={s.stepMessage}>{step.message}</span> : null}
                        {step.createdAt ? <span className={s.stepMeta}>{formatDate(step.createdAt)}</span> : null}
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
