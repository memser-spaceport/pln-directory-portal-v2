import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import type { FeedbackImage } from '../../utils/splitFeedbackMedia';

import { looksLikeHtml } from '../../utils/looksLikeHtml';
import { getAvatarColor } from '../../utils/getAvatarColor';

import { FeedbackBody } from '../FeedbackBody';
import { FeedbackStatusSelector } from '../FeedbackStatusSelector';

import s from './FeedbackTable.module.scss';

interface Props {
  readonly rows: AiAppFeedbackRow[];
  /** The row whose status write is in flight, if any — its selector locks until the mutation settles. */
  readonly pendingFeedbackUid?: string;
  readonly onStatusSelect: (row: AiAppFeedbackRow, status: AiAppFeedbackStatus) => void;
  readonly onImageClick: (image: FeedbackImage) => void;
}

export function FeedbackTable({ rows, pendingFeedbackUid, onStatusSelect, onImageClick }: Props) {
  return (
    <div className={s.tableWrapper}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.appCol}>App</th>
            <th>Feedback</th>
            <th className={s.fromCol}>From</th>
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
                  <FeedbackBody text={row.text} onImageClick={onImageClick} />
                </td>
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
                <td>
                  <FeedbackStatusSelector
                    status={row.status}
                    isPending={pendingFeedbackUid === row.uid}
                    onStatusSelect={(status) => onStatusSelect(row, status)}
                  />
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
