import Link from 'next/link';
import { AI_APP_FEEDBACK_PRIORITY_LABELS, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import { SHOW_AI_APPS_COMMENTS, SHOW_AI_APPS_FEEDBACK_OVERLAY } from '@/services/ai-apps/constants';
import type { AiAppFeedbackLinearIssue, AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import { Tooltip } from '@/components/core/tooltip/tooltip';

import type { FeedbackImage } from '../../utils/splitFeedbackMedia';

import { looksLikeHtml } from '../../utils/looksLikeHtml';
import { getAvatarColor } from '../../utils/getAvatarColor';

import { FeedbackBody } from '../FeedbackBody';
import { FeedbackStatusSelector, StatusBadge } from '../FeedbackStatusSelector';

import s from './FeedbackTable.module.scss';

interface Props {
  readonly rows: AiAppFeedbackRow[];
  /** The row whose status write is in flight, if any — its selector locks until the mutation settles. */
  readonly pendingFeedbackUid?: string;
  /** Omitted on the submitter's own list: every row is theirs, so no From column, and the status is read-only. */
  readonly onStatusSelect?: (row: AiAppFeedbackRow, status: AiAppFeedbackStatus) => void;
  readonly onImageClick: (image: FeedbackImage) => void;
}

/** Where the item's Linear issue stands; nothing when it isn't sent. */
export function LinearIssueChip({ issue }: { readonly issue: AiAppFeedbackLinearIssue | null | undefined }) {
  if (!issue) return null;
  if (issue.status === 'SYNCED' && issue.url) {
    return (
      <a className={s.linearChip} href={issue.url} target="_blank" rel="noopener noreferrer">
        {issue.identifier ?? 'Linear issue'}
      </a>
    );
  }
  if (issue.status === 'PENDING') {
    return <span className={s.linearPending}>Sending to Linear…</span>;
  }
  if (issue.status === 'FAILED') {
    return (
      <Tooltip
        asChild
        trigger={
          <span className={s.linearFailed} tabIndex={0}>
            Couldn&apos;t send to Linear
          </span>
        }
        content={issue.lastError ?? 'Linear returned an error.'}
      />
    );
  }
  return null;
}

export function FeedbackTable({ rows, pendingFeedbackUid, onStatusSelect, onImageClick }: Props) {
  return (
    <div className={s.tableWrapper}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.appCol}>App</th>
            <th>Feedback</th>
            <th className={s.kindCol}>Kind</th>
            <th className={s.priorityCol}>
              <span className={s.priorityHeader}>
                Priority
                <Tooltip
                  asChild
                  trigger={
                    <button type="button" className={s.priorityHelp} aria-label="Priority levels">
                      <img src="/icons/help.svg" alt="" width={16} height={16} />
                    </button>
                  }
                  content={
                    <ul className={s.priorityLegend}>
                      {Object.values(AI_APP_FEEDBACK_PRIORITY_LABELS).map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  }
                />
              </span>
            </th>
            {onStatusSelect && <th className={s.fromCol}>From</th>}
            <th className={s.statusCol}>Status</th>
            <th className={s.dateCol}>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const submitterName = row.member?.name ?? 'Unknown member';
            return (
              <tr key={row.uid}>
                <td className={s.appNameCell} title={row.appName}>
                  {row.appName}
                </td>
                <td title={looksLikeHtml(row.text) ? undefined : row.text}>
                  {/* Comments (left on the live app) are public; feedback (the form) is not. */}
                  <span className={row.kind === 'COMMENT' ? s.kindComment : s.kindFeedback}>
                    {row.kind === 'COMMENT' ? 'Comment' : 'Feedback'}
                  </span>
                  <FeedbackBody text={row.text} onImageClick={onImageClick} />
                  {SHOW_AI_APPS_COMMENTS && SHOW_AI_APPS_FEEDBACK_OVERLAY && (row.pinCount ?? 0) > 0 && (
                    <Link
                      className={s.showOnPage}
                      href={`/pl-infra/ai-apps/${encodeURIComponent(row.appUid)}?feedback=${encodeURIComponent(row.uid)}`}
                    >
                      Show on page
                    </Link>
                  )}
                </td>
                <td>{row.reportKind ?? ''}</td>
                <td>{row.priority ?? ''}</td>
                {onStatusSelect && (
                  <td>
                    <div className={s.submitter}>
                      <span className={s.avatar} style={{ background: getAvatarColor(submitterName) }}>
                        {submitterName.charAt(0).toUpperCase()}
                      </span>
                      <span className={s.submitterName} title={submitterName}>
                        {submitterName}
                      </span>
                    </div>
                  </td>
                )}
                <td>
                  {onStatusSelect ? (
                    <div className={s.statusStack}>
                      <FeedbackStatusSelector
                        status={row.status}
                        isPending={pendingFeedbackUid === row.uid}
                        onStatusSelect={(status) => onStatusSelect(row, status)}
                      />
                      {/* The creator's / admins' view only: the submitter's list never carries it. */}
                      <LinearIssueChip issue={row.linearIssue} />
                    </div>
                  ) : (
                    <StatusBadge status={row.status} />
                  )}
                </td>
                <td className={s.dateCell}>
                  {new Date(row.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
