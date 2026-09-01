'use client';
import { type MouseEvent } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { DocumentIcon, EyeIcon, UsersThreeIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { AiApp, deployFailureKind, hasPrd } from '@/services/ai-apps/ai-apps.service';
import { formatAiAppDate, formatCount } from '@/utils/ai-apps.utils';
import { DetailsItem } from '@/components/core/UpdatesPanel/NotificationItem/components/NotificationFooter/components/DetailsItem';
import nf from '@/components/core/UpdatesPanel/NotificationItem/components/NotificationFooter/NotificationFooter.module.scss';

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
  const isDeploying = app.status === 'DEPLOYING';
  const failureKind = deployFailureKind(app);

  const showManageMenu = !!canManage && !!onEdit && !!onDeployment && !!onDelete;
  const showDetailsButton = !!onViewDetails && hasPrd(app);
  // Failure UI is manager-only: a visitor's card must be indistinguishable from
  // a healthy one, whatever the deploy state. A rolled-back app ('warning')
  // still works, and even the unavailable one ('danger') reveals its state only
  // to people who can act on it.
  const showFailureStrip = failureKind !== null && !!canManage;
  const showSeeLogs = showFailureStrip && !!onLogs;
  // Dimming is the danger treatment — manager-only too.
  const showDanger = failureKind === 'danger' && !!canManage;

  const views = app.viewCount ?? 0;
  const wau = app.weeklyActiveUsers ?? 0;
  const metrics = [
    ...(views > 0 ? [{ icon: <EyeIcon width={16} height={13} />, value: formatCount(views), label: 'views' }] : []),
    ...(wau > 0
      ? [
          {
            icon: <UsersThreeIcon width={14} height={14} />,
            value: formatCount(wau),
            label: 'weekly active users',
          },
        ]
      : []),
  ];

  const body = (
    <>
      {/* Reserve room for the ⋯ menu so long names ellipsize instead of sliding under it. */}
      <div className={clsx(s.nameRow, { [s.nameRowMenu]: showManageMenu })}>
        <h3 className={s.name}>{app.name}</h3>
        {isDraft && <span className={s.draftBadge}>Draft</span>}
        {isDeploying && <span className={s.deployingBadge}>Deploying</span>}
      </div>
      <p className={s.description}>{app.description}</p>
      {metrics.length > 0 && (
        <div className={`${nf.details} ${s.metricsRow}`}>
          {metrics.map((m) => (
            <DetailsItem key={m.label} data={m} showIcon showLabel />
          ))}
        </div>
      )}
    </>
  );

  // A direct child of .root, never nested in the card's <Link>/<button> —
  // link-inside-link is invalid HTML and breaks keyboard/SR semantics. It sits
  // above the stretched-link overlay like .actionSlot does.
  const failureStrip = showFailureStrip && (
    <div className={clsx(s.failStrip, { [s.failStripWarning]: failureKind === 'warning' })}>
      <span className={s.failStripLabel}>
        {failureKind === 'warning' ? "Latest deploy didn't ship" : 'Deploy failed'}
      </span>
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
          <p className={s.deployed}>Last updated {formatAiAppDate(app.updatedAt)}</p>
        </div>
      </div>

      {showDetailsButton && (
        <Button
          size="xxs"
          style="border"
          variant="neutral"
          className={s.detailsButton}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          aria-label={`App details for ${app.name}`}
        >
          <DocumentIcon aria-hidden />
          App Details
        </Button>
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
      <article className={clsx(s.root, { [s.rootWithStrip]: showFailureStrip, [s.rootFailed]: showDanger })}>
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
    <article className={clsx(s.root, { [s.rootWithStrip]: showFailureStrip, [s.rootFailed]: showDanger })}>
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
