'use client';

import { useMemo, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';

import type { AiAppWithDoc, LogStream } from './mocks';

import s from './DeploymentLogsModal.module.scss';

/** Rows per page. Build streams rarely fill one; runtime streams always do. */
const PAGE_SIZE = 25;

interface Props {
  isOpen: boolean;
  app: AiAppWithDoc;
  onClose: () => void;
  /** Opens the deployment-settings flow (retry the failed deploy after fixing secrets/limits). */
  onRetry: () => void;
}

/**
 * Read-only troubleshooting view of an app's deploy, split across the two log
 * sources the platform actually produces:
 *  - Build — finite, one per deploy attempt, replayed oldest-first, ends in an
 *    exit code.
 *  - Runtime — the container's continuous stream, tailed newest-first over a
 *    retention window, independent of any single attempt.
 *
 * The table is deliberately two columns — a log line is a message and a time.
 * Stage, resource, and status ride inside the message cell as muted detail
 * rather than as columns of their own, which were mostly repeated values.
 */
export function DeploymentLogsModal({ isOpen, app, onClose, onRetry }: Props) {
  // Open on the stream that holds the failure. Landing on a clean build log
  // when the cause is an OOM kill in runtime is how you conclude, wrongly, that
  // nothing is wrong.
  const [stream, setStream] = useState<LogStream>(app.deployment?.failureStream ?? 'build');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState(false);

  const deployment = app.deployment;
  const buildLogs = deployment?.buildLogs ?? [];
  const runtimeLogs = deployment?.runtimeLogs ?? [];
  const source = stream === 'build' ? buildLogs : runtimeLogs;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((l) => `${l.stage} ${l.message} ${l.resource ?? ''}`.toLowerCase().includes(q));
  }, [source, query]);

  if (!deployment) return null;

  const failed = app.status === 'ERROR';
  const buildFailed = deployment.exitCode !== 0;
  // A build that never produced an image means the app never ran at all — the
  // runtime tab is empty for a reason worth stating, not just blank.
  const neverRan = runtimeLogs.length === 0;

  // Clamp the page whenever the search shrinks the result set under the cursor.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const copyLogs = () => {
    const text = filtered.map((l) => `${l.date} ${l.time}  ${l.message}`).join('\n');
    // Prototype-only convenience; clipboard is best-effort, so failures are ignored.
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  };

  const tabs: { key: LogStream; label: string; count: number }[] = [
    { key: 'build', label: 'Build', count: buildLogs.length },
    { key: 'runtime', label: 'Runtime', count: runtimeLogs.length },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h2 className={s.title}>Deployment logs</h2>
            <div className={s.metaRow}>
              <span className={s.metaItem}>{app.name}</span>
              <span className={`${s.status} ${failed ? s.statusFailed : s.statusLive}`}>
                {failed ? 'Deploy failed' : 'Live'}
              </span>
            </div>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {/* The two sources are separate tabs, not a filter — they differ in
            lifecycle, so they need different controls. */}
        <div className={s.tabs} role="tablist" aria-label="Log stream">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={stream === t.key}
              className={s.tab}
              data-active={stream === t.key}
              onClick={() => {
                setStream(t.key);
                setPage(0);
              }}
            >
              {t.label}
              <span className={s.tabCount}>{t.count}</span>
            </button>
          ))}

          {/* Stream-specific context: an attempt + exit code for the finite
              build, a live/retention window for the continuous runtime tail. */}
          <div className={s.streamNote}>
            {stream === 'build' ? (
              <>
                <span>
                  Attempt {deployment.attempt} · {deployment.buildDuration}
                </span>
                <span className={buildFailed ? s.exitBad : s.exitOk}>exit {deployment.exitCode}</span>
              </>
            ) : (
              <>
                {!neverRan && (
                  <span className={s.live}>
                    <span className={s.liveDot} aria-hidden />
                    Live
                  </span>
                )}
                <span>{deployment.retention}</span>
              </>
            )}
          </div>
        </div>

        {stream === 'runtime' && neverRan ? (
          <div className={s.emptyState}>
            <p className={s.emptyTitle}>This app has never run</p>
            <p className={s.emptyText}>
              The build failed before producing an image, so no container ever started and there are no runtime logs.
              Check the Build tab for the error.
            </p>
            <Button style="border" variant="neutral" size="s" onClick={() => setStream('build')}>
              View build log
            </Button>
          </div>
        ) : (
          <>
            <div className={s.toolbar}>
              <input
                className={s.search}
                type="search"
                value={query}
                placeholder="Search logs"
                aria-label="Search deployment logs"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
              <button type="button" className={s.copyBtn} onClick={copyLogs}>
                {copied ? 'Copied' : 'Export'}
              </button>
            </div>

            {failed && stream === 'build' && !buildFailed && (
              <p className={s.failNote}>
                The build itself succeeded — nothing here explains the failure. The new revision never became healthy,
                so LabOS rolled back. Check the <strong>Runtime</strong> tab for the cause.
              </p>
            )}

            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">Message</th>
                    <th scope="col">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l, i) => (
                    <tr key={`${l.time}-${start + i}`} className={s[l.level]}>
                      <td className={s.messageCell}>
                        {(l.level === 'warn' || l.level === 'error') && (
                          <>
                            <span className={s.levelDot} aria-hidden />
                            <span className={s.srOnly}>{l.level === 'error' ? 'Error: ' : 'Warning: '}</span>
                          </>
                        )}
                        <span className={s.messageText}>{l.message}</span>
                        {(l.resource || l.status) && (
                          <span className={s.detail}>
                            {l.resource}
                            {l.resource && l.status ? ' · ' : ''}
                            {l.status ? `${l.status.label.toLowerCase()} ${l.status.code}` : ''}
                          </span>
                        )}
                      </td>
                      <td className={s.timeCell}>
                        <span className={s.date}>{l.date}</span>
                        <span className={s.time}>{l.time}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && <p className={s.empty}>No log lines match “{query}”.</p>}
            </div>
          </>
        )}

        <div className={s.footer}>
          <span className={s.count}>
            {filtered.length > 0 ? (
              <>
                Showing{' '}
                <strong>
                  {start + 1}–{start + rows.length}
                </strong>{' '}
                of {filtered.length} events
              </>
            ) : (
              <>0 events</>
            )}
          </span>

          <div className={s.footerActions}>
            {pageCount > 1 && (
              <div className={s.pager}>
                <button
                  type="button"
                  className={s.pageBtn}
                  aria-label="Previous page"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M10 12L6 8l4-4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <span className={s.pageLabel}>
                  {safePage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  className={s.pageBtn}
                  aria-label="Next page"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <Button style="border" variant="neutral" size="s" onClick={onClose}>
              Close
            </Button>
            {failed && (
              <Button style="fill" variant="primary" size="s" onClick={onRetry}>
                Retry deploy
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
