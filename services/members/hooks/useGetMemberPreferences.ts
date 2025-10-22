import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useQuery } from '@tanstack/react-query';

export interface MemberPreferencesResponse {
  preferenceSettings: {
    email: boolean;
    github: boolean;
    telegram: boolean;
    discord: boolean;
    linkedin: boolean;
    twitter: boolean;
    githubProjects: boolean;
    newsLetter: boolean;
  };
  memberPreferences: {
    email: boolean;
    github: boolean;
    githubProjects: boolean;
    telegram: boolean;
    discord: boolean;
    linkedin: boolean;
    twitter: boolean;
    newsLetter: boolean;
    showOfficeHoursDialog?: boolean;
  };
  isPreferenceAvailable: boolean;
}

async function fetcher(uid: string | undefined): Promise<MemberPreferencesResponse | null> {
  if (!uid) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/preferences`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch member preferences');
  }

  const rawPreferences = await response.json();

  const preferenceSettings = {
    email: rawPreferences?.email ?? false,
    github: rawPreferences?.github ?? false,
    telegram: rawPreferences?.telegram ?? false,
    discord: rawPreferences?.discord ?? false,
    linkedin: rawPreferences?.linkedin ?? false,
    twitter: rawPreferences?.twitter ?? false,
    githubProjects: rawPreferences?.github ?? false,
    newsLetter: true,
  };

  const memberPreferences = {
    email: rawPreferences?.showEmail,
    github: rawPreferences?.showGithubHandle,
    githubProjects: rawPreferences?.showGithubProjects,
    telegram: rawPreferences?.showTelegram,
    discord: rawPreferences?.showDiscord,
    linkedin: rawPreferences?.showLinkedin,
    twitter: rawPreferences?.showTwitter,
    newsLetter: rawPreferences?.isSubscribedToNewsletter ?? false,
    showOfficeHoursDialog: rawPreferences?.showOfficeHoursDialog ?? true, // Default to true
  };

  return {
    preferenceSettings,
    memberPreferences,
    isPreferenceAvailable: rawPreferences.isnull,
  };
}

export function useGetMemberPreferences(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER_PREFERENCES, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
