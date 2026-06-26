'use client';

import Link from 'next/link';

import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
}

export function AiAppDetailPage(props: Props) {
  const { uid } = props;

  const { app, isLoading, isError } = useAiApp(uid);

  if (isLoading) {
    return <div className={s.state}>Loading app…</div>;
  }

  if (isError) {
    return <div className={s.state}>Unable to load this app. Please try again later.</div>;
  }

  if (!app) {
    return <div className={s.state}>App not found.</div>;
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <Link href="/pl-infra/ai-apps" className={s.backButton}>
            ← All AI Apps
          </Link>
          <h1 className={s.name}>{app.name}</h1>
          {app.description && <p className={s.description}>{app.description}</p>}
          <p className={s.author}>
            By{' '}
            <Link href={`/members/${app.member.uid}`} className={s.authorLink}>
              {app.member.name}
            </Link>
          </p>
        </div>
        <div className={s.actions}>
          <a href={app.url} target="_blank" rel="noopener noreferrer" className={s.openButton}>
            Open in New Tab ↗
          </a>
        </div>
      </div>

      <div className={s.iframeContainer}>
        <iframe className={s.iframe} src={app.url} title={app.name} allow="fullscreen" />
      </div>
    </div>
  );
}
