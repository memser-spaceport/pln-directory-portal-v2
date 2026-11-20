import { DigestTopicsCard, type DigestTopicsCardProps } from './DigestTopicsCard';

import s from './DigestSidebar.module.scss';

/**
 * The topics section (LAB-3348, LAB-3346 R1): "How personalization works" first, as the explainer of Add topics,
 * then the Add topics card. From 1100px it opens the side column; under that it sits right after the page header
 * (`top`), so a reader on a phone sees it before the stories.
 */
export function DigestTopicsSection({ variant, topics }: { variant: 'rail' | 'top'; topics: DigestTopicsCardProps }) {
  return (
    <>
      <section className={s.card} aria-labelledby={`how-${variant}`}>
        <h2 id={`how-${variant}`} className={s.cardTitle}>
          How personalization works
        </h2>
        <p className={s.cardText}>
          Stories come from your topics first, then the teams you follow, then the network’s top stories.
        </p>
      </section>
      <DigestTopicsCard headingId={`topics-${variant}`} {...topics} />
    </>
  );
}
