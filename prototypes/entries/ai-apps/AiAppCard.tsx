'use client';

import type { KeyboardEvent } from 'react';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';

// Reuse the same tag style the team-profile prototype uses for the Demo Day tag
// (TeamCard's "series"/"Pre-seed" pill).
import tc from '@/components/common/LogosGrid/components/TeamCard/TeamCard.module.scss';
import s from './AiAppCard.module.scss';

interface Props {
  readonly app: AiAppWithDoc;
  readonly canManage: boolean;
  readonly onSelect: () => void;
  readonly onEdit: () => void;
  readonly onDeployment: () => void;
  readonly onLogs: () => void;
  readonly onDelete: () => void;
  readonly onViewOnePager: () => void;
}

export function AiAppCard({
  app,
  canManage,
  onSelect,
  onEdit,
  onDeployment,
  onLogs,
  onDelete,
  onViewOnePager,
}: Props) {
  const isDraft = app.status === 'DRAFT';
  // Two separate questions. "Did the last deploy fail" decides whether we show a
  // notice; "is anything serving" decides whether the app reads as unavailable.
  // An app that rolled back is still working, so it must not look broken.
  const deployFailed = app.status === 'ERROR';
  const serving = app.deployment?.serving ?? 'latest';
  const isUnavailable = serving === 'none';
  const isStale = deployFailed && serving === 'previous';
  // A rolled-back app works fine, so only its creator needs telling that the
  // latest change didn't ship — to a visitor it's an ordinary, working app. An
  // app with nothing serving is broken for everyone, so everyone sees that.
  const showNotice = isUnavailable || (isStale && canManage);
  const hasOnePager = !!app.onePager;
  // Anyone who can see the app gets the "App Details" footer tag to open the
  // 1-pager. Creators also get the ⋯ manage menu in the corner — the two are
  // distinct actions (view the doc vs. manage the app).
  const showOnePagerButton = hasOnePager;

  // The whole card is clickable, so it's a role="button" div (a real <button>
  // can't wrap the nested "App details" button). Mirror button keyboard support.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      className={`${s.root} ${isUnavailable ? s.rootFailed : ''} ${showNotice ? s.rootNotice : ''}`}
    >
      <div className={s.cardButton} role="button" tabIndex={0} onClick={onSelect} onKeyDown={handleKeyDown}>
        {/* Status banner across the top of the card. It gets its own row rather
            than a slot in the footer, whose single action slot already belongs
            to "App Details" — so the two never compete for the same space. */}
        {showNotice && (
          <div className={`${s.failStrip} ${isUnavailable ? s.failStripDanger : s.failStripWarning}`}>
            <span className={s.failStripLabel}>{isUnavailable ? 'Deploy failed' : "Latest deploy didn't ship"}</span>
            {/* Creator-only — the logs are internal. */}
            {canManage && (
              <button
                type="button"
                className={s.seeLogsButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogs();
                }}
              >
                See logs
              </button>
            )}
          </div>
        )}

        <div className={s.body}>
          <div className={`${s.nameRow} ${canManage ? s.nameRowMenu : ''}`}>
            <h3 className={s.name}>{app.name}</h3>
            {isDraft && <span className={s.draftBadge}>Draft</span>}
          </div>
          <p className={s.description}>{app.description}</p>
        </div>

        <div className={s.footer}>
          <div className={s.author}>
            <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
            <div className={s.authorText}>
              <p className={s.authorLine}>
                <span className={s.creatorTitle}>by</span> <span className={s.creatorName}>{app.member.name}</span>
              </p>
              <p className={s.deployed}>
                {isDraft ? 'Draft created' : isUnavailable ? 'Never deployed' : 'Deployed'}{' '}
                {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {showOnePagerButton && (
            <button
              type="button"
              className={s.detailsButton}
              onClick={(e) => {
                e.stopPropagation();
                onViewOnePager();
              }}
              aria-label={`App details for ${app.name}`}
            >
              <span className={`${tc.stage} ${s.detailsBadge}`}>
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
        </div>
      </div>

      {canManage && (
        <div className={s.actionSlot}>
          <AppActionsMenu
            appName={app.name}
            onEdit={onEdit}
            onDeployment={onDeployment}
            onLogs={onLogs}
            onDelete={onDelete}
          />
        </div>
      )}
    </article>
  );
}
