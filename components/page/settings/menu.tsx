'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SettingsMenuProps {
  activeItem?: 'profile' | 'privacy' | 'manage members' | 'manage teams';
}

function SettingsMenu({ activeItem }: SettingsMenuProps) {
  const isTeamLead = false;
  const isAppAdmin = true;
  const router = useRouter();
  const preferences = [
    { name: 'profile', url: '/settings/profile', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
    { name: 'privacy', url: '/settings/privacy', icon: '/icons/privacy.svg', activeIcon: '/icons/privacy-blue.svg' },
  ];
  const teamAdminSettings = [{ name: 'manage teams', url: '/settings/teams', icon: '/icons/team.svg', activeIcon: '/icons/teams-blue.svg' }];

  const appAdminSettings = [
    { name: 'manage members', url: '/settings/members', icon: '/icons/profile.svg', activeIcon: '/icons/profile-blue.svg' },
    { name: 'manage teams', url: '/settings/teams', icon: '/icons/team.svg', activeIcon: '/icons/teams-blue.svg' },
  ];

  const onItemClicked = (url: string) => {
    let skip = false;
    const actionElement = document.getElementById('settings-actions');
    if(actionElement?.style.visibility === 'visible') {
      skip = !confirm("There are some unsaved changed. Do you want to proceed?");
    }
   
    if(skip) {
      return;
    }
    router.push(url);
  };
  return (
    <>
      <div className="sm">
        <div className="sm__group">
          <h3 className="sm__group__title">Preferences</h3>
          <div className="sm__group__list">
            {preferences.map((pref) => (
              <div onClick={() => onItemClicked(pref.url)} key={`settings-${pref.name}`} className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}>
                {activeItem === pref.name && <img width="16" height="16" alt={pref.name} src={pref.activeIcon} />}
                {activeItem !== pref.name && <img width="16" height="16" alt={pref.name} src={pref.icon} />}
                <p className="sm__group__list__item__text">{pref.name}</p>
                <img className="sm__group__list__item__arrow" width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
              </div>
            ))}
          </div>
        </div>
        <div className="sm__group">
          <h3 className="sm__group__title">Admin Settings</h3>
          <div className="sm__group__list">
            {isTeamLead &&
              teamAdminSettings.map((pref) => (
                <div key={`settings-${pref.name}`} onClick={() => onItemClicked(pref.url)} className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}>
                  {activeItem === pref.name && <img width="16" height="16" alt={pref.name} src={pref.activeIcon} />}
                  {activeItem !== pref.name && <img width="16" height="16" alt={pref.name} src={pref.icon} />}
                  <p className="sm__group__list__item__text">{pref.name}</p>
                  <img className="sm__group__list__item__arrow" width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
                </div>
              ))}
            {isAppAdmin &&
              appAdminSettings.map((pref) => (
                <div key={`settings-${pref.name}`} onClick={() => onItemClicked(pref.url)} className={`sm__group__list__item ${activeItem === pref.name ? 'sm__group__list__item--active' : ''}`}>
                  {activeItem === pref.name && <img width="16" height="16" alt={pref.name} src={pref.activeIcon} />}
                  {activeItem !== pref.name && <img width="16" height="16" alt={pref.name} src={pref.icon} />}
                  <p className="sm__group__list__item__text">{pref.name}</p>
                  <img className="sm__group__list__item__arrow" width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
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
            line-height: 16px;
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
            padding-top: 2.5px;
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

export default SettingsMenu;