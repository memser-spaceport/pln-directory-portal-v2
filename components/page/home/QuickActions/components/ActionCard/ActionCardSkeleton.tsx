import s from './ActionCard.module.scss';

/**
 * Placeholder that holds a card's exact footprint while the card set is still
 * unknown. Deliberately built from ActionCard's own DOM and stylesheet rather
 * than a hardcoded height, so the two can't drift apart across the desktop
 * grid and the mobile carousel.
 *
 * Only reachable when the server-side /me/access call failed — see QuickActions.
 */
export function ActionCardSkeleton() {
  return (
    <span className={s.link} aria-hidden="true">
      <span className={s.card}>
        <span className={`${s.icon} ${s.skeletonBlock}`} />
        <span className={s.text}>
          <span className={`${s.title} ${s.skeletonBlock}`}>&nbsp;</span>
          <span className={`${s.description} ${s.skeletonBlock}`}>&nbsp;</span>
        </span>
      </span>
    </span>
  );
}
