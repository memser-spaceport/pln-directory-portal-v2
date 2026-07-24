'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { AiApp, AiAppLogStream, FetchAiAppLogsResult } from '@/services/ai-apps/ai-apps.service';
import {
  deriveLogLevel,
  formatLogTimestamp,
  stripCriLogPrefix,
  stripLogControlSequences,
} from '@/services/ai-apps/ai-apps-logs.utils';
import { useAiAppLogs, RUNTIME_WINDOW_LABEL } from '@/services/ai-apps/hooks/useAiAppLogs';

import s from './DeploymentLogsModal.module.scss';

const TITLE_ID = 'deployment-logs-title';
const PANEL_ID = 'deployment-logs-panel';

interface Props {
  app: AiApp;
  onClose: () => void;
}

interface PreparedLine {
  key: string;
  text: string;
  searchText: string;
  level: 'error' | 'warn' | null;
  /** "Jul 23" — empty when the raw value didn't parse. */
  date: string;
  /** "14:24:24", or the raw value verbatim when unparseable. */
  clock: string;
  /** Full "Jul 23 14:24:24" (or raw) — the export line's prefix. */
  time: string;
}

/**
 * Prepared once per loaded snapshot: prefix/control-sequence stripping, level
 * derivation, and timestamp formatting never run per keystroke or per render.
 * The CRI framing is stripped because the event's own timestamp already fills
 * the table's second column — keeping it would print every time twice.
 */
function prepareLines(result: FetchAiAppLogsResult | null): PreparedLine[] {
  if (!result) return [];
  return result.events.map((event, i) => {
    const text = stripLogControlSequences(stripCriLogPrefix(event.message));
    const time = formatLogTimestamp(event.timestamp);
    // formatLogTimestamp yields "MMM d HH:mm:ss" for anything parseable; a raw
    // fallback value stays whole and rides in the clock slot.
    const parts = /^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2}$/.test(time) ? time.split(' ') : null;
    return {
      key: `${event.timestamp}-${i}`,
      text,
      searchText: text.toLowerCase(),
      level: deriveLogLevel(text),
      date: parts ? `${parts[0]} ${parts[1]}` : '',
      clock: parts ? parts[2] : time,
      time,
    };
  });
}

/**
 * Read-only troubleshooting view of an app's two log sources: Build (finite,
 * one per deploy attempt) and Runtime (the pod's stdout/stderr over a
 * retention window). One scrollable chronological pane per stream — log lines
 * are never paginated — loaded bottom-anchored because failures live at the
 * end. Data changes only on open and on the explicit Refresh button; live
 * tailing is deliberately out of v1.
 *
 * Must be conditionally rendered by the parent (`action && <Modal/>`): closing
 * unmounts it, which is what aborts an in-flight fetch (the queryFn consumes
 * React Query's signal). Keeping it mounted behind `isOpen` would leak fetches.
 *
 * Log content can carry injected secrets and member PII, so the pane, search
 * input, and export button are `ph-no-capture` (PostHog session replay /
 * autocapture must never see log text), messages render as text nodes only,
 * and analytics events carry counts — never content.
 */
export function DeploymentLogsModal({ app, onClose }: Props) {
  const analytics = useAiAppsAnalytics();

  // Mount-time default: a failed or in-flight deploy is a build-log story;
  // a healthy app's interesting logs are runtime. Never switched by effects —
  // the tab must not move under the reader when a status poll lands.
  const [stream, setStream] = useState<AiAppLogStream>(() =>
    app.status === 'ERROR' || app.status === 'DEPLOYING' ? 'build' : 'runtime',
  );
  const [query, setQuery] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [announcement, setAnnouncement] = useState('');

  // Both streams load on open — the tab counts need them; each is one request.
  const build = useAiAppLogs(app.uid, 'build', { enabled: true });
  const runtime = useAiAppLogs(app.uid, 'runtime', { enabled: true });
  const active = stream === 'build' ? build : runtime;

  const buildLines = useMemo(() => prepareLines(build.result), [build.result]);
  const runtimeLines = useMemo(() => prepareLines(runtime.result), [runtime.result]);
  const lines = stream === 'build' ? buildLines : runtimeLines;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((line) => line.searchText.includes(q));
  }, [lines, query]);

  const paneRef = useRef<HTMLDivElement>(null);
  const buildTabRef = useRef<HTMLButtonElement>(null);
  const runtimeTabRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bottom-anchor whenever the visible snapshot changes (load, refresh, tab
  // switch) — the newest lines are the reason the modal was opened.
  useEffect(() => {
    const pane = paneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [lines, stream]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const switchStream = (next: AiAppLogStream) => {
    if (next === stream) return;
    setStream(next);
    setQuery('');
    analytics.onDeploymentLogsTabSwitched(app.uid, next);
  };

  // WAI-ARIA tabs: arrow keys move and activate; roving tabindex below.
  const handleTablistKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = stream === 'build' ? 'runtime' : 'build';
    switchStream(next);
    (next === 'build' ? buildTabRef : runtimeTabRef).current?.focus();
  };

  const handleRefresh = () => {
    Promise.allSettled([build.refetch(), runtime.refetch()]).then(() => {
      setAnnouncement('Logs refreshed');
    });
  };

  const handleExport = () => {
    const text = filtered.map((line) => `${line.time}  ${line.text}`).join('\n');
    const setTransient = (state: 'copied' | 'failed') => {
      setCopyState(state);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1600);
    };
    if (!navigator.clipboard) {
      setTransient('failed');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setTransient('copied');
        setAnnouncement('Logs copied to clipboard');
        analytics.onDeploymentLogsExported(app.uid, stream, filtered.length);
      },
      () => setTransient('failed'),
    );
  };

  const isRefreshing = build.isRefetching || runtime.isRefetching;
  const failed = active.result?.termination.reason === 'failed' ? active.result.termination : null;
  const truncated = active.result?.termination.reason === 'truncated';
  const isEmpty = !!active.result && active.result.events.length === 0 && !failed;

  const statusChip =
    app.status === 'ERROR'
      ? { label: 'Deploy failed', className: s.statusFailed }
      : app.status === 'DEPLOYING'
        ? { label: 'Deploying', className: s.statusDeploying }
        : { label: 'Live', className: s.statusLive };

  const tabs: { key: AiAppLogStream; label: string; count: number | null; ref: typeof buildTabRef }[] = [
    { key: 'build', label: 'Build', count: build.result ? buildLines.length : null, ref: buildTabRef },
    { key: 'runtime', label: 'Runtime', count: runtime.result ? runtimeLines.length : null, ref: runtimeTabRef },
  ];

  const renderBody = () => {
    if (active.isLoading) {
      return (
        <div className={s.skeleton} aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={s.skeletonRow} style={{ width: `${55 + ((i * 17) % 40)}%` }} />
          ))}
        </div>
      );
    }

    // Whole-stream failure (or an unexpected throw surfaced by React Query).
    if ((failed && active.result?.events.length === 0) || (!active.result && active.isError)) {
      const copy =
        failed?.errorKind === 'forbidden'
          ? { title: 'You don’t have access to logs for this app.', hint: null }
          : failed?.errorKind === 'not-found'
            ? { title: 'Logs for this app could not be found.', hint: null }
            : { title: 'Unable to load logs. Please try again later.', hint: null };
      return (
        <div className={s.stateBlock}>
          <p className={s.stateTitle}>{copy.title}</p>
          {failed?.errorKind !== 'forbidden' && failed?.errorKind !== 'not-found' && (
            <Button style="border" variant="neutral" size="s" onClick={() => active.refetch()}>
              Retry
            </Button>
          )}
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div className={s.stateBlock}>
          <p className={s.stateTitle}>
            {stream === 'build' ? 'No build logs available.' : 'No runtime logs in this window.'}
          </p>
          <p className={s.stateText}>
            {stream === 'build'
              ? 'Logs may have expired from retention, or no build has produced output yet.'
              : `Only the ${RUNTIME_WINDOW_LABEL} of runtime output is shown.`}
          </p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className={s.stateBlock}>
          <p className={s.stateTitle}>No lines match “{query.trim()}”.</p>
          <Button style="border" variant="neutral" size="s" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </div>
      );
    }

    // The prototype's two-column table: message takes the slack, the timestamp
    // is a fixed right rail split into a muted date and a dark clock.
    return (
      <div
        ref={paneRef}
        className={`${s.tableWrap} ph-no-capture`}
        role="region"
        aria-label="Deployment logs"
        tabIndex={0}
      >
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Message</th>
              <th scope="col">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((line) => (
              <tr key={line.key} className={line.level ? s[line.level] : undefined}>
                <td className={s.messageCell}>
                  {line.level && (
                    <>
                      <span className={s.levelDot} aria-hidden />
                      <span className={s.srOnly}>{line.level === 'error' ? 'Error: ' : 'Warning: '}</span>
                    </>
                  )}
                  <span className={s.messageText}>{line.text}</span>
                </td>
                <td>
                  <span className={s.timeCell}>
                    {line.date && <span className={s.date}>{line.date}</span>}
                    <span className={s.time}>{line.clock}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal isOpen onClose={onClose} className={s.modal} ariaLabelledBy={TITLE_ID} lockScroll inertBackground>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h2 className={s.title} id={TITLE_ID}>
              Deployment logs
            </h2>
            <div className={s.metaRow}>
              <span className={s.appName}>{app.name}</span>
              <span className={`${s.status} ${statusChip.className}`}>{statusChip.label}</span>
            </div>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.tabs} role="tablist" aria-label="Log stream" onKeyDown={handleTablistKeyDown}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={tab.ref}
              type="button"
              role="tab"
              id={`deployment-logs-tab-${tab.key}`}
              aria-selected={stream === tab.key}
              aria-controls={PANEL_ID}
              tabIndex={stream === tab.key ? 0 : -1}
              className={s.tab}
              data-active={stream === tab.key}
              onClick={() => switchStream(tab.key)}
            >
              {tab.label}
              {tab.count !== null && <span className={s.tabCount}>{tab.count}</span>}
            </button>
          ))}
          {stream === 'runtime' && <span className={s.streamNote}>{RUNTIME_WINDOW_LABEL}</span>}
        </div>

        <div className={s.panel} role="tabpanel" id={PANEL_ID} aria-labelledby={`deployment-logs-tab-${stream}`}>
          <div className={s.toolbar}>
            <input
              className={`${s.search} ph-no-capture`}
              type="search"
              value={query}
              placeholder="Search logs"
              aria-label="Search deployment logs"
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className={s.toolBtn} onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              className={`${s.toolBtn} ph-no-capture`}
              onClick={handleExport}
              disabled={filtered.length === 0}
              title="Copy the lines currently shown (filtered) to the clipboard"
            >
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Export'}
            </button>
          </div>

          {app.status === 'DEPLOYING' && (
            <p className={s.deployingNote}>Deploy in progress — use Refresh to pull the latest lines.</p>
          )}

          {renderBody()}
        </div>

        <div className={s.footer}>
          <span className={s.count}>
            {query.trim() ? (
              <>
                Showing <strong>{filtered.length}</strong> of {lines.length} events
              </>
            ) : (
              <>
                <strong>{lines.length}</strong> events
              </>
            )}
            {truncated && ' · log truncated to the 2,000-line limit'}
            {' · times in your local time'}
          </span>
          <Button style="border" variant="neutral" size="s" onClick={onClose}>
            Close
          </Button>
        </div>

        <span className={s.srOnly} role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    </Modal>
  );
}
