'use client';

import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { usePathname, useRouter } from 'next/navigation';

import { useGetMenuItems } from './hooks/useGetMenuItems';

import { SettingsMenuGroup } from './components/SettingsMenuGroup';

import s from './SettingsMenu.module.scss';

interface SettingsMenuProps {
  isAdmin?: boolean;
  isTeamLead?: boolean;
  userInfo: IUserInfo;
}

export function SettingsMenu({ isAdmin = false, isTeamLead = false, userInfo }: SettingsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const analytics = useSettingsAnalytics();

  const { account, preferences, appAdminSettings, teamAdminSettings } = useGetMenuItems(userInfo);

  const onItemClicked = (url: string, name: string) => {
    if (window.innerWidth < 1024 || pathname.includes('recommendations')) {
      triggerLoader(true);
      router.push(url);
    } else {
      document.dispatchEvent(new CustomEvent('settings-navigate', { detail: { url: url } }));
    }
    analytics.recordSettingsSideMenuClick(name, url, getAnalyticsUserInfo(userInfo));
  };

  return (
    <div className={s.root}>
      <SettingsMenuGroup title="Account" onItemClicked={onItemClicked} items={account} />
      <SettingsMenuGroup title="Preferences" onItemClicked={onItemClicked} items={preferences} />

      {(isAdmin || isTeamLead) && (
        <SettingsMenuGroup
          title="Admin Settings"
          onItemClicked={onItemClicked}
          items={[...(isAdmin ? appAdminSettings : []), ...teamAdminSettings]}
        />
      )}
    </div>
  );
}
