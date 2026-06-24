'use client';

import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
}

export function AiAppDetailPage(props: Props) {
  const { uid } = props;

  const { app, isLoading } = useAiApp(uid);

  if (isLoading) {
    return null;
  }

  if (!app) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <h1 className={s.name}>{app.name}</h1>
          {app.description && <p className={s.description}>{app.description}</p>}
          <p className={s.author}>
            By <span>{app.member.name}</span>
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
