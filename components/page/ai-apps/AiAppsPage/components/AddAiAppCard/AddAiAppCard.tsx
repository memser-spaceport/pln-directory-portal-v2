'use client';

import { AI_APPS_STARTER_KIT_VERSION } from '@/services/ai-apps/constants';

import s from './AddAiAppCard.module.scss';

interface Props {
  onClick: () => void;
}

export function AddAiAppCard({ onClick }: Props) {
  return (
    <button type="button" className={s.root} onClick={onClick}>
      <img className={s.icon} src="/icons/add.svg" alt="" />
      <p className={s.title}>Create AI App</p>
      <p className={s.text}>Start building your AI app here</p>
      <p className={s.version}>Starter Kit v{AI_APPS_STARTER_KIT_VERSION}</p>
    </button>
  );
}
