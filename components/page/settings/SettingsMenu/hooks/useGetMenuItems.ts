import { useMemo } from 'react';

import { IUserInfo } from '@/types/shared.types';
import { useMemberNotificationsSettings } from '@/services/members/hooks/useMemberNotificationsSettings';

export function useGetMenuItems(userInfo: IUserInfo) {
  const { data } = useMemberNotificationsSettings(userInfo.uid);

  const { recommendationsEnabled } = data || {};

  return useMemo(() => {
    const preferences = [
      {
        name: 'notification preferences',
        url: '/settings/email',
        icon: '/icons/bell.svg',
        activeIcon: '/icons/bell-blue.svg',
      },
    ];

    if (recommendationsEnabled) {
      preferences.push({
        name: 'recommendations',
        url: '/settings/recommendations',
        icon: '/icons/recommendations.svg',
        activeIcon: '/icons/recommendations-blue.svg',
      });
    }

    preferences.push({
      name: 'job preferences',
      url: '/settings/job-alerts',
      icon: '/icons/briefcase.svg',
      activeIcon: '/icons/briefcase-blue.svg',
    });

    return {
      preferences,
      account: [
        {
          name: 'email & accounts',
          url: '/settings/accounts',
          icon: '/icons/email.svg',
          activeIcon: '/icons/email-blue.svg',
        },
      ],
      teamAdminSettings: [
        { name: 'manage teams', url: '/settings/teams', icon: '/icons/team.svg', activeIcon: '/icons/teams-blue.svg' },
      ],
      appAdminSettings: [
        {
          name: 'manage members',
          url: '/settings/members',
          icon: '/icons/profile.svg',
          activeIcon: '/icons/profile-blue.svg',
        },
      ],
    };
  }, [recommendationsEnabled]);
}
