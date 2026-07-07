'use client';

/**
 * COPY-SIMPLIFY of the production settings `SettingsMenu`. Production reads
 * `useMemberNotificationsSettings` (react-query), analytics, and router to
 * navigate; here the list is static and clicks are no-ops — it's just context
 * for the Email Preferences tab. Markup + styled-jsx copied verbatim so it
 * tracks production's look.
 */
const PREFERENCES = [
  { name: 'connected accounts', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
  { name: 'email preferences', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg' },
  { name: 'recommendations', icon: '/icons/recommendations.svg', activeIcon: '/icons/recommendations-blue.svg' },
  { name: 'job alert', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg' },
];

export function SettingsMenuMock({ activeItem = 'email preferences' }: { activeItem?: string }) {
  return (
    <>
      <div className="sm">
        <div className="sm__group">
          <h3 className="sm__group__title">Preferences</h3>
          <div className="sm__group__list">
            {PREFERENCES.map((pref) => (
              <div
                key={`settings-${pref.name}`}
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
            ))}
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
