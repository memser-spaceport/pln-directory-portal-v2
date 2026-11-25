import s from './AllEventsPage.module.scss';

/**
 * "Live" at the start of a card's time line (LAB-3425): the AI Apps deploy status pill. The space inside it keeps the
 * word apart from the time in the card's accessible name; it takes no room on screen.
 */
export function LivePill() {
  return <span className={s.livePill}>Live </span>;
}
