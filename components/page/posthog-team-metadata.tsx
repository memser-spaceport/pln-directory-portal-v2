'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';
import { authEvents } from '@/components/core/login/utils/authEvents';
import { getHeader } from '@/utils/common.utils';

const TEAM_CACHE_KEY = 'ph_team_cache';
const MEMBERS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/members`;

interface TeamCacheData {
  teamUid: string;
  name: string;
  priority: string;
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

export default function PostHogTeamMetadata() {
  const posthog = usePostHog();
  const lastTeamUidRef = useRef<string | null>(null);

  useEffect(() => {
    const updateTeamMetadata = async () => {
      try {
        const userCookie = Cookies.get('userInfo');
        const authTokenCookie = Cookies.get('authToken');

        if (!userCookie || !posthog) {
          return;
        }

        const userInfo = getParsedValue(userCookie);
        const authToken = authTokenCookie ? JSON.parse(authTokenCookie) : '';

        // Get memberUid from userInfo
        const memberUid = userInfo?.uid;

        if (!memberUid) {
          return;
        }

        // Fetch fresh data (member data contains teamMemberRoles with mainTeam flag)
        const mainTeamData = await fetchMainTeamFromMember(memberUid, authToken);

        if (!mainTeamData) {
          return;
        }

        // Check if teamUid changed
        if (lastTeamUidRef.current !== mainTeamData.teamUid) {
          // Clear previous registration if team changed
          if (lastTeamUidRef.current) {
            posthog.unregister('mainTeamName');
            posthog.unregister('mainTeamPriority');
          }
          lastTeamUidRef.current = mainTeamData.teamUid;
        }

        // Check cache first
        const cached = getTeamCache();
        if (cached && cached.teamUid === mainTeamData.teamUid) {
          // Use cached values
          const priorityValue = Number(cached.priority) >= 99 ? 'NA' : cached.priority;
          posthog.register({
            mainTeamName: cached.name,
            mainTeamPriority: priorityValue,
          });
          return;
        }

        // Cache the team data (only team object: name and priority)
        setTeamCache({
          teamUid: mainTeamData.teamUid,
          name: mainTeamData.name,
          priority: mainTeamData.priority,
        });

        // Register with PostHog
        posthog.register({
          mainTeamName: mainTeamData.name,
          mainTeamPriority: mainTeamData.priority,
        });
      } catch (error) {
        console.error('PostHog Team Metadata error:', error);
      }
    };

    updateTeamMetadata();
  }, [posthog]);

  // Listen for logout events to clear cache and unregister properties
  useEffect(() => {
    const handleLogout = () => {
      clearTeamCache();
      if (posthog) {
        posthog.unregister('mainTeamName');
        posthog.unregister('mainTeamPriority');
      }
      lastTeamUidRef.current = null;
    };

    const unsubscribe = authEvents.on('auth:logout', handleLogout);

    return () => {
      unsubscribe();
    };
  }, [posthog]);

  // This component doesn't render anything
  return null;
}
