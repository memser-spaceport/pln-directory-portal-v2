import { MemberNotificationSettings } from '@/services/members/types';

export const getMemberNotificationSettings = async (uid: string, authToken: string) => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}`;

  const response = await fetch(url, {
    cache: 'default',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response?.ok) {
    return { isError: true };
  }

  const data: MemberNotificationSettings = await response.json();

  return data;
};

export const getMemberPreferences = async (uid: string, authToken: string) => {
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${uid}/preferences`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!result.ok) {
    return { isError: true };
  }

  const rawPreferences = await result.json();
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
  };

  return {
    preferenceSettings,
    memberPreferences,
    isPreferenceAvailable: rawPreferences.isnull,
  };
};
