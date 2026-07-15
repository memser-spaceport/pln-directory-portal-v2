'use client';
import { type MouseEvent } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// import { ArrowUpRightIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

import s from './AiAppCard.module.scss';

interface Props {
  app: AiApp;
  onSelect?: () => void;
}

export function AiAppCard(props: Props) {
  const { app, onSelect } = props;
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

  const body = (
    <>
      <div className={s.nameRow}>
        <h3 className={s.name}>{app.name}</h3>
        {isDraft && <span className={s.draftBadge}>Draft</span>}
        {hasDeployFailed && <span className={s.errorBadge}>Deploy failed</span>}
        {isDeploying && <span className={s.deployingBadge}>Deploying</span>}
      </div>
      <p className={s.description}>{app.description}</p>
    </>
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

      {/* <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className={s.openButton}
        onClick={(e) => {
          e.stopPropagation();
          analytics.onOpenInNewTabClicked(app.uid, app.name, app.url);
          if (onSelect) {
            e.preventDefault();
            alert('Prototype: would open the deployed app in a new tab.');
          }
        }}
      >
        Open in new tab
        <ArrowUpRightIcon className={s.openButtonIcon} width={14} height={14} />
      </a> */}
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={s.root}
        onClick={() => {
          handleCardClick();
          onSelect();
        }}
      >
        <div className={s.body}>{body}</div>
        {footer}
      </button>
    );
  }

  return (
    <article className={s.root}>
      {/* stretchedLink expands the hit area to the whole card (the card can't BE
          the link — the footer holds a nested author link). */}
      <Link href={`/pl-infra/ai-apps/${app.uid}`} className={clsx(s.body, s.stretchedLink)} onClick={handleCardClick}>
        {body}
      </Link>
      {footer}
    </article>
  );
}
