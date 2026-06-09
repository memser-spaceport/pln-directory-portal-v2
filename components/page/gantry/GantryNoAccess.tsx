'use client';

import s from './GantryShell.module.scss';

export function GantryNoAccess() {
  return (
    <div className={s.noAccess}>
      <h2>You do not have access to Gantry.</h2>
      <p>Ask an admin to grant roadmap permissions.</p>
    </div>
  );
}
