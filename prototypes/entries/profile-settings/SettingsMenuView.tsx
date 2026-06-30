'use client';

import clsx from 'clsx';

import { PREFERENCES } from './mocks';
import s from './ProfileSettings.module.scss';

/**
 * Copy-simplified from the production settings `menu`. The production menu is
 * router / analytics / notifications-hook bound; this renders the same grouped
 * nav statically with "Profile" active.
 */
export function SettingsMenuView({ active = 'profile' }: { active?: string }) {
  return (
    <nav className={s.menu} aria-label="Settings">
      <div className={s.menuGroup}>
        <h3 className={s.menuTitle}>Preferences</h3>
        <div className={s.menuList}>
          {PREFERENCES.map((item) => {
            const isActive = active === item.name;
            return (
              <button
                key={item.name}
                type="button"
                className={clsx(s.menuItem, { [s.menuItemActive]: isActive })}
                aria-current={isActive ? 'page' : undefined}
              >
                <img width="16" height="16" alt="" src={isActive ? item.activeIcon : item.icon} />
                <span className={s.menuItemText}>{item.name}</span>
                <img className={s.menuArrow} width="12" height="12" alt="" src="/icons/arrow-right.svg" />
              </button>
            );
          })}
        </div>
      </div>

      <div className={s.menuGroup}>
        <h3 className={s.menuTitle}>Admin Settings</h3>
        <div className={s.menuList}>
          <button type="button" className={s.menuItem}>
            <img width="16" height="16" alt="" src="/icons/team.svg" />
            <span className={s.menuItemText}>manage teams</span>
            <img className={s.menuArrow} width="12" height="12" alt="" src="/icons/arrow-right.svg" />
          </button>
        </div>
      </div>
    </nav>
  );
}
