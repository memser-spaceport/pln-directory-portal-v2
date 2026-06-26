'use client';

import s from './AddAiAppCard.module.scss';

interface Props {
  onClick: () => void;
}

export function AddAiAppCard({ onClick }: Props) {
  return (
    <button type="button" className={s.root} onClick={onClick}>
      <img className={s.icon} src="/icons/add.svg" alt="" />
      <p className={s.title}>Create your app</p>
      <p className={s.text}>Start building your app here</p>
    </button>
  );
}
