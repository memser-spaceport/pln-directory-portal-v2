'use client';

/**
 * COPY-SIMPLIFY of the production settings `SettingsMenu`
 * (components/page/settings/menu.tsx). Production reads
 * `useMemberNotificationsSettings` (react-query), fires analytics, and navigates
 * via router / a `settings-navigate` CustomEvent; here the list is static and
 * clicks only move the active row. Markup + styled-jsx are copied verbatim from
 * production so the rail tracks its look.
 *
 * Two deliberate design changes — the subject of this prototype:
 *
 * 1. NEW "contact details" item, placed first. Today the only place a member can
 *    change their email is an unlabeled pencil inside a disabled field on their
 *    own profile page, so people look here, find nothing, and email support.
 * 2. "email preferences" → "notification preferences". The old name absorbed the
 *    "change my email address" intent and paid it back with digest toggles.
 *
 * Consequence of (1): "contact details" is not a preference, so the single
 * "Preferences" group is split into Account + Preferences. Icons are reassigned
 * to match — connected accounts takes the link glyph it always should have had,
 * and notification preferences takes the bell.
 *
 * Both groups are written out inline rather than through a shared render helper:
 * styled-jsx only scopes JSX in the component body that owns the `<style jsx>`
 * tag, so JSX built inside a nested function renders with unscoped class names
 * and picks up none of these rules.
 */
/**
 * One item, not two. "Contact details" and "Connected accounts" sitting next to
 * each other both read as "where my identity lives", which reproduces the
 * dithering this change exists to remove — so they are merged into a single tab
 * holding the email address, the sign-in methods and the contact handles.
 *
 * The envelope is free again: it belonged to "email preferences", which is now
 * "notification preferences" under the bell. So the one item a member hunting
 * for their email address sees is labelled with the word they are looking for
 * and marked with the icon they expect.
 */
const ACCOUNT = [{ name: 'email & accounts', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg' }];

/**
 * `recommendations` is omitted: production only pushes it into this list when
 * the member's notification settings carry `recommendationsEnabled`
 * (menu.tsx:46), and `/settings/recommendations` redirects home otherwise. The
 * mocked member doesn't have it.
 */
const PREFERENCES = [
  { name: 'notification preferences', icon: '/icons/bell.svg', activeIcon: '/icons/bell-blue.svg' },
  { name: 'job alert', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg' },
];

/** Production's Admin Settings group: `manage members` (isAdmin), `manage teams` (isTeamLead || isAdmin). */
const APP_ADMIN = [{ name: 'manage members', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' }];
const TEAM_ADMIN = [{ name: 'manage teams', icon: '/icons/team.svg', activeIcon: '/icons/teams-blue.svg' }];

interface Props {
  activeItem?: string;
  onSelect?: (name: string) => void;
  isAdmin?: boolean;
  isTeamLead?: boolean;
}

export function SettingsMenuMock({ activeItem = 'contact details', onSelect, isAdmin, isTeamLead }: Props) {
  return (
    <>
      <div className="sm">
        <div className="sm__group">
          <h3 className="sm__group__title">Account</h3>
          <div className="sm__group__list">
            {ACCOUNT.map((pref) => (
              <div
                key={`settings-${pref.name}`}
                onClick={() => onSelect?.(pref.name)}
                className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}
              >
                <img width="16" height="16" alt="" src={activeItem === pref.name ? pref.activeIcon : pref.icon} />
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

        <div className="sm__group">
          <h3 className="sm__group__title">Preferences</h3>
          <div className="sm__group__list">
            {PREFERENCES.map((pref) => (
              <div
                key={`settings-${pref.name}`}
                onClick={() => onSelect?.(pref.name)}
                className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}
              >
                <img width="16" height="16" alt="" src={activeItem === pref.name ? pref.activeIcon : pref.icon} />
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

        {(isAdmin || isTeamLead) && (
          <div className="sm__group">
            <h3 className="sm__group__title">Admin Settings</h3>
            <div className="sm__group__list">
              {[...(isAdmin ? APP_ADMIN : []), ...(isTeamLead || isAdmin ? TEAM_ADMIN : [])].map((pref) => (
                <div
                  key={`settings-${pref.name}`}
                  onClick={() => onSelect?.(pref.name)}
                  className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}
                >
                  <img width="16" height="16" alt="" src={activeItem === pref.name ? pref.activeIcon : pref.icon} />
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
        )}
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
