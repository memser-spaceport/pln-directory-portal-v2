'use client';
import { type MouseEvent } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { DocumentIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { AiApp, hasPrd } from '@/services/ai-apps/ai-apps.service';

import { AppActionsMenu } from '../../../AppActionsMenu';

import s from './AiAppCard.module.scss';

interface Props {
  app: AiApp;
  onSelect?: () => void;
  /**
   * Render the manage ⋯ menu. The caller applies the canManage heuristic
   * (creator or directory admin); the menu itself confirms against the
   * detail endpoint when opened.
   */
  canManage?: boolean;
  onEdit?: () => void;
  onDeployment?: () => void;
  onDelete?: () => void;
  /** Open the deployment-logs modal; `source` says which affordance was used. */
  onLogs?: (source: 'menu' | 'failure-strip') => void;
  /** Open the public App Details (one-pager) viewer. Shown to every viewer when a one-pager exists. */
  onViewDetails?: () => void;
}

export function AiAppCard(props: Props) {
  const { app, onSelect, canManage, onEdit, onDeployment, onDelete, onLogs, onViewDetails } = props;
  const analytics = useAiAppsAnalytics();

  const handleAuthorClick = (e: MouseEvent) => {
    if (onSelect) e.stopPropagation();
    analytics.onAuthorClicked(app.uid, app.member.uid, app.member.name);
  };

  const handleCardClick = () => {
    analytics.onCardClicked(app.uid, app.name);
  };

  const isDraft = app.status === 'DRAFT';
  const hasDeployFailed = app.status === 'ERROR';
  const isDeploying = app.status === 'DEPLOYING';

  const showManageMenu = !!canManage && !!onEdit && !!onDeployment && !!onDelete;
  const showDetailsButton = !!onViewDetails && hasPrd(app);
  // The strip took over the old inline "Deploy failed" badge's job — everyone
  // sees it; only managers get its "See logs" link.
  const showFailureStrip = hasDeployFailed;
  const showSeeLogs = showFailureStrip && !!canManage && !!onLogs;

  const body = (
    <>
      {/* Reserve room for the ⋯ menu so long names ellipsize instead of sliding under it. */}
      <div className={clsx(s.nameRow, { [s.nameRowMenu]: showManageMenu })}>
        <h3 className={s.name}>{app.name}</h3>
        {isDraft && <span className={s.draftBadge}>Draft</span>}
        {isDeploying && <span className={s.deployingBadge}>Deploying</span>}
      </div>
      <p className={s.description}>{app.description}</p>
    </>
  );

  // A direct child of .root, never nested in the card's <Link>/<button> —
  // link-inside-link is invalid HTML and breaks keyboard/SR semantics. It sits
  // above the stretched-link overlay like .actionSlot does.
  const failureStrip = showFailureStrip && (
    <div className={s.failStrip}>
      <span className={s.failStripLabel}>Deploy failed</span>
      {showSeeLogs && (
        <button type="button" className={s.seeLogsButton} onClick={() => onLogs('failure-strip')}>
          See logs
        </button>
      )}
    </div>
  );

  const footer = (
    <div className={s.footer}>
      <div className={s.author}>
        <img
          className={s.avatar}
          src={app.member.image || getDefaultAvatar(app.member.name)}
          alt=""
          width={20}
          height={20}
        />
        <div className={s.authorText}>
          <p className={s.authorLine}>
            <span className={s.creatorTitle}>by</span>{' '}
            <Link
              href={`/members/${app.member.uid}`}
              className={s.creatorLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAuthorClick}
            >
              {app.member.name}
            </Link>
          </p>
          <p className={s.deployed}>
            {isDraft ? 'Draft created' : 'Deployed'} {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {showDetailsButton && (
        <button
          type="button"
          className={s.detailsButton}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          aria-label={`App details for ${app.name}`}
        >
          <span className={s.detailsBadge}>
            <DocumentIcon aria-hidden />
            App Details
          </span>
        </button>
      )}
    </div>
  );

  const actionSlot = showManageMenu && (
    <div className={s.actionSlot}>
      <AppActionsMenu
        app={app}
        onEdit={onEdit}
        onDeployment={onDeployment}
        onLogs={() => onLogs?.('menu')}
        onDelete={onDelete}
      />
    </div>
  );

  if (onSelect) {
    return (
      <article className={clsx(s.root, { [s.rootWithStrip]: showFailureStrip })}>
        {failureStrip}
        <button
          type="button"
          className={s.selectButton}
          onClick={() => {
            handleCardClick();
            onSelect();
          }}
        >
          <div className={s.body}>{body}</div>
          {footer}
        </button>
        {actionSlot}
      </article>
    );
  }

  return (
    <article className={clsx(s.root, { [s.rootWithStrip]: showFailureStrip })}>
      {failureStrip}
      {/* stretchedLink expands the hit area to the whole card (the card can't BE
          the link — the footer holds a nested author link). */}
      <Link href={`/pl-infra/ai-apps/${app.uid}`} className={clsx(s.body, s.stretchedLink)} onClick={handleCardClick}>
        {body}
      </Link>
      {footer}
      {actionSlot}
    </article>
  );
}
