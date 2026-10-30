import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { useQuery } from '@tanstack/react-query';
import { readNewsTags } from '@/utils/news-tags';

export interface MemberPreferencesResponse {
  preferenceSettings: {
    email: boolean;
    github: boolean;
    telegram: boolean;
    discord: boolean;
    linkedin: boolean;
    twitter: boolean;
    bluesky: boolean;
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
    bluesky: boolean;
    newsLetter: boolean;
    showOfficeHoursDialog?: boolean;
    showForumBanner?: boolean;
    showDemoDayConnectDialog?: boolean;
    showDemoDayInvestDialog?: boolean;
    showFeedbackButton?: boolean;
  };
  isPreferenceAvailable: boolean;
  /** News preferences (LAB-3000): the member's tags, focus-area slugs. */
  newsTags: string[];
  /** True while the member never saved tags: `newsTags` are then their teams' focus areas. */
  newsTagsSeeded: boolean;
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
  // Named fields, not a spread: a spread here breaks the object-literal union callers narrow with `isError`.
  const { newsTags, newsTagsSeeded } = readNewsTags(rawPreferences);

  const preferenceSettings = {
    email: rawPreferences?.email ?? false,
    github: rawPreferences?.github ?? false,
    telegram: rawPreferences?.telegram ?? false,
    discord: rawPreferences?.discord ?? false,
    linkedin: rawPreferences?.linkedin ?? false,
    twitter: rawPreferences?.twitter ?? false,
    bluesky: rawPreferences?.bluesky ?? false,
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
    bluesky: rawPreferences?.showBluesky,
    newsLetter: rawPreferences?.isSubscribedToNewsletter ?? false,
    showOfficeHoursDialog: rawPreferences?.showOfficeHoursDialog ?? true, // Default to true
    showForumBanner: rawPreferences?.showForumBanner ?? true, // Default to true
    showDemoDayConnectDialog: rawPreferences?.showDemoDayConnectDialog ?? true, // Default to true
    showDemoDayInvestDialog: rawPreferences?.showDemoDayInvestDialog ?? true, // Default to true
    showFeedbackButton: rawPreferences?.showFeedbackButton ?? true,
  };

  return {
    preferenceSettings,
    memberPreferences,
    isPreferenceAvailable: rawPreferences.isnull,
    // Top level rather than in memberPreferences: forms that echo that object
    // back in a PATCH must not carry it along.
    newsTags,
    newsTagsSeeded,
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
