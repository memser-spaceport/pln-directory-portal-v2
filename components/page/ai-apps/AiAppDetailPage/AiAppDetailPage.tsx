'use client';

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
      <iframe className={s.iframe} src={app.url} title={app.name} allow="fullscreen" />
    </div>
  );
}
