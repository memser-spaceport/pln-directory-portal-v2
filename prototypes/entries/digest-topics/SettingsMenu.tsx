'use client';

/**
 * Copy of ../email-preferences/SettingsMenuMock (itself a copy-simplify of the
 * production SettingsMenu), with two changes: a "News preferences" item after
 * Email Preferences, and items are clickable so the prototype can switch pages.
 * Markup + styled-jsx are unchanged.
 */
export type SettingsPage = 'email preferences' | 'news preferences';

const PREFERENCES = [
  { name: 'connected accounts', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
  { name: 'email preferences', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg' },
  // NEW. No news icon exists in /icons; globe is the closest pair with a blue variant.
  { name: 'news preferences', icon: '/icons/globe.svg', activeIcon: '/icons/globe-blue.svg' },
  { name: 'recommendations', icon: '/icons/recommendations.svg', activeIcon: '/icons/recommendations-blue.svg' },
  { name: 'job alert', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg' },
];

export function SettingsMenu({ activeItem, onSelect }: { activeItem: SettingsPage; onSelect: (p: SettingsPage) => void }) {
  return (
    <>
      <div className="sm">
        <div className="sm__group">
          <h3 className="sm__group__title">Preferences</h3>
          <div className="sm__group__list">
            {PREFERENCES.map((pref) => {
              const selectable = pref.name === 'email preferences' || pref.name === 'news preferences';
              return (
                <div
                  key={`settings-${pref.name}`}
                  role={selectable ? 'link' : undefined}
                  tabIndex={selectable ? 0 : undefined}
                  onClick={() => selectable && onSelect(pref.name as SettingsPage)}
                  onKeyDown={(e) => selectable && e.key === 'Enter' && onSelect(pref.name as SettingsPage)}
                  className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}
                >
                  <img width="16" height="16" alt={pref.name} src={activeItem === pref.name ? pref.activeIcon : pref.icon} />
                  <p className="sm__group__list__item__text">{pref.name}</p>
                  <img
                    className="sm__group__list__item__arrow"
                    width="12"
                    height="12"
                    alt="arrow right"
                    src="/icons/arrow-right.svg"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .sm {
            padding: 24px;
          }
          .sm__group__title {
            color: #94a3b8;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .sm__group {
            padding-bottom: 16px;
          }
          .sm__group__list {
            padding: 16px 0;
          }
          .sm__group__list__item {
            font-size: 16px;
            line-height: 1;
            padding: 16px 24px;
            cursor: pointer;
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: flex-start;
            color: #475569;
            font-weight: 400;
            text-transform: capitalize;
          }
          .sm__group__list__item__text {
            flex: 1;
          }
          .sm__group__list__item__arrow {
            display: inline-block;
          }
          .sm__group__list__item--active {
            background: #f1f5f9;
            color: #156ff7;
            border-radius: 8px;
          }

          @media (min-width: 1024px) {
            .sm__group__list__item__arrow {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}
