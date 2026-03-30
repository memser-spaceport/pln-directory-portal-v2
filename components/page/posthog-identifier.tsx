'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';
import { getHeader } from '@/utils/common.utils';
import { authEvents } from '@/components/core/login/utils/authEvents';

const TEAM_CACHE_KEY = 'ph_team_cache';
const MEMBERS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/members`;

interface TeamCacheData {
  teamUid: string;
  name: string;
  priority: string;
}

interface TeamMemberRole {
  mainTeam?: boolean;
  team?: {
    uid?: string;
    name?: string;
    priority?: number;
  };
}

interface MemberResponse {
  uid?: string;
  teamMemberRoles?: TeamMemberRole[];
}

function getTeamCache(): TeamCacheData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(TEAM_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setTeamCache(data: TeamCacheData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is not available
  }
}

function clearTeamCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TEAM_CACHE_KEY);
  } catch {
    // Silently fail if localStorage is not available
  }
}

async function fetchMainTeamFromMember(
  memberUid: string,
  authToken: string,
): Promise<{ teamUid: string; name: string; priority: string } | null> {
  try {
    const response = await fetch(`${MEMBERS_API_URL}/${memberUid}`, {
      method: 'GET',
      headers: getHeader(authToken),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const result: MemberResponse = await response.json();

    // Find the main team from teamMemberRoles array
    const mainTeamRole = result?.teamMemberRoles?.find((role) => role.mainTeam === true);
    const team = mainTeamRole?.team;

    if (!team?.uid) {
      return null;
    }

    // Priority logic: if priority >= 99, set to 'NA' equivalent (we store as string for PostHog)
    const rawPriority = typeof team.priority === 'number' ? team.priority : 99;
    const priority = rawPriority >= 99 ? 'NA' : String(rawPriority);

    return {
      teamUid: team.uid,
      name: team.name || '',
      priority: priority,
    };
  } catch {
    return null;
  }
}

export default function PostHogIdentifier() {
  const posthog = usePostHog();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const identifyUser = async () => {
      try {
        const userCookie = Cookies.get('userInfo');
        const authTokenCookie = Cookies.get('authToken');

        if (!userCookie || !posthog) {
          return;
        }

        const userInfo = getParsedValue(userCookie);
        const authToken = authTokenCookie ? JSON.parse(authTokenCookie) : '';

        if (!userInfo?.uid && !userInfo?.id) {
          return;
        }

        const userId = userInfo.uid || userInfo.id;
        const storeKey = `directory-user-identified-${userId}`;
        const isAlreadyIdentifiedInSession = localStorage.getItem(storeKey);

        // Only identify if this is a different user or not identified in this session
        if (lastUserIdRef.current === userId && isAlreadyIdentifiedInSession) {
          return;
        }

        // Fetch team metadata
        let teamProperties = {
          mainTeamName: 'none',
          mainTeamPriority: 'NA',
        };
        if (userInfo?.uid && authToken) {
          const cached = getTeamCache();
          let mainTeamData = cached;

          if (!cached) {
            mainTeamData = await fetchMainTeamFromMember(userInfo.uid, authToken);
            if (mainTeamData) {
              setTeamCache({
                teamUid: mainTeamData.teamUid,
                name: mainTeamData.name,
                priority: mainTeamData.priority,
              });
            }
          }

          if (mainTeamData) {
            const priorityValue = Number(mainTeamData.priority) >= 99 ? 'NA' : mainTeamData.priority;
            teamProperties = {
              mainTeamName: mainTeamData.name,
              mainTeamPriority: priorityValue,
            };
          }
        }

        // Identify user with PostHog including team metadata
        posthog.identify(userId, {
          email: userInfo.email,
          name: userInfo.name,
          uid: userInfo.uid,
          ...teamProperties,
        });

        lastUserIdRef.current = userId;

        // Mark as identified
        localStorage.setItem(storeKey, 'true');
      } catch (error) {
        console.error('PostHog Auto-Identifier error:', error);
      }
    };

    // Identify user on component mount
    identifyUser();
  }, [posthog]);

  // Listen for logout events to clear cache
  useEffect(() => {
    const handleLogout = () => {
      clearTeamCache();
      lastUserIdRef.current = null;
    };

    const unsubscribe = authEvents.on('auth:logout', handleLogout);

    return () => {
      unsubscribe();
    };
  }, [posthog]);

  // This component doesn't render anything
  return null;
}
