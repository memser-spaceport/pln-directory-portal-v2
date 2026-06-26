'use client';
import Link from 'next/link';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ArrowUpRightIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

import s from './AiAppCard.module.scss';

interface Props {
  app: AiApp;
  onSelect?: () => void;
}

export function AiAppCard(props: Props) {
  const { app, onSelect } = props;

  const body = (
    <>
      <h3 className={s.name}>{app.name}</h3>
      <p className={s.description}>{app.description}</p>
    </>
  );

  const footer = (
    <div className={s.footer}>
      <div className={s.author}>
        <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
        <div className={s.authorText}>
          <p className={s.authorLine}>
            <span className={s.creatorTitle}>by</span>{' '}
            <Link
              href={`/members/${app.member.uid}`}
              className={s.creatorLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSelect ? (e) => e.stopPropagation() : undefined}
            >
              {app.member.name}
            </Link>
          </p>
          <p className={s.deployed}>Deployed {new Date(app.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className={s.openButton}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) {
            e.preventDefault();
            alert('Prototype: would open the deployed app in a new tab.');
          }
        }}
      >
        Open in new tab
        <ArrowUpRightIcon className={s.openButtonIcon} width={14} height={14} />
      </a>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" className={s.root} onClick={onSelect}>
        <div className={s.body}>{body}</div>
        {footer}
      </button>
    );
  }

  return (
    <article className={s.root}>
      <Link href={`/pl-infra/ai-apps/${app.uid}`} className={s.body}>
        {body}
      </Link>
      {footer}
    </article>
  );
}
