'use client';

import type { AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';

// Reuse the grid card's "App Details" pill (DS grey Badge + doc icon) verbatim.
import tc from '@/components/common/LogosGrid/components/TeamCard/TeamCard.module.scss';
// Reuse the Forum post's Back button styling (chevron + "Back") verbatim.
import bb from '@/components/ui/BackButton/BackButton.module.scss';
import card from './AiAppCard.module.scss';
import s from './AiAppDetail.module.scss';

interface Props {
  app: AiAppWithDoc;
  previewSrcDoc?: string;
  onBack: () => void;
  /** Creator-only: mounts the same ⋯ menu the grid card shows. */
  canManage: boolean;
  onEdit: () => void;
  onDeployment: () => void;
  onLogs: () => void;
  onDelete: () => void;
  /** Opens the 1-pager viewer — same action as the card's "App Details" button. */
  onViewOnePager: () => void;
}

export function AiAppDetail(props: Props) {
  const { app, previewSrcDoc, onBack, canManage, onEdit, onDeployment, onLogs, onDelete, onViewOnePager } = props;

  const hasOnePager = !!app.onePager;

  return (
    <div className={s.page}>
      {/* Full-width header bar pinned to the top of the app page. */}
      <header className={s.topBar}>
        <button type="button" className={bb.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11 14L5 8L11 2"
              stroke="#5E718D"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        {/* Right-side actions, mirroring the grid card: view the 1-pager, plus
            the creator's ⋯ manage menu. */}
        <div className={s.topBarActions}>
          {hasOnePager && (
            <button
              type="button"
              className={card.detailsButton}
              onClick={onViewOnePager}
              aria-label={`App details for ${app.name}`}
            >
              <span className={`${tc.stage} ${card.detailsBadge}`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M4 1.5h5L13 5.5V13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13V3A1.5 1.5 0 0 1 4 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path d="M8.5 1.5V6h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                App Details
              </span>
            </button>
          )}
          {canManage && (
            <AppActionsMenu
              appName={app.name}
              onEdit={onEdit}
              onDeployment={onDeployment}
              onLogs={onLogs}
              onDelete={onDelete}
            />
          )}
        </div>
      </header>

      {/* App identity (name / description / author) intentionally omitted here —
          the embedded preview carries its own title bar, so repeating it above
          only duplicates. */}
      <div className={s.root}>
        <div className={s.previewWrap}>
          <iframe className={s.iframe} srcDoc={previewSrcDoc} title={app.name} allow="fullscreen" />
        </div>
      </div>
    </div>
  );
}
