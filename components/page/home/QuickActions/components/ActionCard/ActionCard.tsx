import Link from 'next/link';
import { ReactNode } from 'react';

import { ArrowRight } from './components/Icons';

import s from './ActionCard.module.scss';

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
}

export function ActionCard(props: ActionCardProps) {
  const { icon, title, description, href, isExternal } = props;

  const inner = (
    <span className={s.card}>
      <span className={s.icon}>{icon}</span>
      <span className={s.text}>
        <span className={s.title}>{title}</span>
        <span className={s.description}>{description}</span>
      </span>
      <ArrowRight className={s.arrow} />
    </span>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={s.link}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={s.link}>
      {inner}
    </Link>
  );
}
