import s from './AgendaFormatCard.module.scss';

/** A sample of agenda text the parser reads: a date, then "start - end • title" with an optional description. */
export function AgendaFormatCard() {
  return (
    <div className={s.card}>
      <h3 className={s.title}>Agenda Format</h3>
      <p className={s.date}>28 Jan, 2025</p>
      <ul className={s.items}>
        <li>
          <p className={s.time}>10:00 AM - 10:30 AM • Opening Ceremony</p>
          <p className={s.description}>Welcome note and event kickoff</p>
        </li>
        <li>
          <p className={s.time}>10:30 AM - 11:15 AM • Breakfast</p>
        </li>
      </ul>
    </div>
  );
}
