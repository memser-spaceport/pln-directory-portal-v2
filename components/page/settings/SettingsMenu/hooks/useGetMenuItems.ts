import { useMemo } from 'react';

import { IUserInfo } from '@/types/shared.types';
import { useMemberNotificationsSettings } from '@/services/members/hooks/useMemberNotificationsSettings';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { MCP_CONNECTIONS_NEW_FLAG, SHOW_MCP_CONNECTIONS_PAGE } from '@/utils/mcp';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';

export function useGetMenuItems(userInfo: IUserInfo) {
  const { data } = useMemberNotificationsSettings(userInfo.uid);

  const { recommendationsEnabled } = data || {};
  const { canConnect } = useMcpAccess();
  // Open until the member visits /settings/mcp, which dismisses it.
  const { open: mcpIsNew } = useOneTimeCallout(MCP_CONNECTIONS_NEW_FLAG);

  return useMemo(() => {
    const preferences = [
      {
        name: 'notification preferences',
        url: '/settings/email',
        icon: '/icons/bell.svg',
        activeIcon: '/icons/bell-blue.svg',
      },
    ];

    // What shapes For You and the digest's news (LAB-2941), while flagged on.
    if (SHOW_NEWS_PREFERENCES) {
      preferences.push({
        name: 'news preferences',
        url: '/settings/news-preferences',
        icon: '/icons/globe.svg',
        activeIcon: '/icons/globe-blue.svg',
      });
    }

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

    preferences.push({
      name: 'general preferences',
      url: '/settings/general',
      icon: '/icons/settings.svg',
      activeIcon: '/icons/settings-blue.svg',
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
        // Its own page (LAB-2995) for members who can connect agents, while flagged on.
        ...(SHOW_MCP_CONNECTIONS_PAGE && canConnect
          ? [
              {
                name: 'MCP connections',
                url: '/settings/mcp',
                icon: '/icons/link-gray.svg',
                activeIcon: '/icons/link-blue.svg',
                isNew: mcpIsNew,
              },
            ]
          : []),
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
  }, [recommendationsEnabled, canConnect, mcpIsNew]);
}
