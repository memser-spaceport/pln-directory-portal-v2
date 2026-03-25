'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';
import { authEvents } from '@/components/core/login/utils/authEvents';
import { getHeader } from '@/utils/common.utils';

const TEAM_CACHE_KEY = 'ph_team_cache';
const TEAMS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/teams`;

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

async function fetchTeamDetails(
  teamUid: string,
  authToken: string,
): Promise<{ name: string; priority: string } | null> {
  try {
    const response = await fetch(`${TEAMS_API_URL}/${teamUid}`, {
      method: 'GET',
      headers: getHeader(authToken),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    // Priority logic: if priority >= 99, set to 'NA' equivalent (we store as string for PostHog)
    const rawPriority = typeof result?.priority === 'number' ? result.priority : 99;
    const priority = rawPriority >= 99 ? 'NA' : String(rawPriority);

    return {
      name: result?.name || '',
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

        // Get teamUid from mainTeam or leadingTeams
        const teamUid = userInfo?.mainTeam?.id || userInfo?.mainTeam?.uid || userInfo?.leadingTeams?.[0];

        if (!teamUid) {
          return;
        }

        // Check if teamUid changed
        if (lastTeamUidRef.current !== teamUid) {
          // Clear previous registration if team changed
          if (lastTeamUidRef.current) {
            posthog.unregister('mainTeamName');
            posthog.unregister('mainTeamPriority');
          }
          lastTeamUidRef.current = teamUid;
        }

        // Check cache first
        const cached = getTeamCache();
        if (cached && cached.teamUid === teamUid) {
          // Use cached values
          const priorityValue = Number(cached.priority) >= 99 ? 'NA' : cached.priority;
          posthog.register({
            mainTeamName: cached.name,
            mainTeamPriority: priorityValue,
          });
          return;
        }

        // Fetch fresh data
        const teamData = await fetchTeamDetails(teamUid, authToken);

        if (teamData) {
          // Cache the data
          setTeamCache({
            teamUid,
            name: teamData.name,
            priority: teamData.priority,
          });

          // Register with PostHog
          posthog.register({
            mainTeamName: teamData.name,
            mainTeamPriority: teamData.priority,
          });
        }
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
