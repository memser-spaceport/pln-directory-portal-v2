import Link from 'next/link';
import { CaretRightIcon } from '@/components/icons';
import styles from './QuickActions.module.scss';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  isExternal?: boolean;
}

export function ActionCard({ icon, title, description, href, isExternal }: ActionCardProps) {
  const inner = (
    <span className={styles.card}>
      <span className={styles.card__icon}>{icon}</span>
      <span className={styles.card__text}>
        <span className={styles.card__title}>{title}</span>
        <span className={styles.card__description}>{description}</span>
      </span>
      <CaretRightIcon className={styles.card__arrow} />
    </span>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.card__link}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={styles.card__link}>
      {inner}
    </Link>
  );
}
