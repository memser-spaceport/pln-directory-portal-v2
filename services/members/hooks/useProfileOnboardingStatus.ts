import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';
import { ProfileOnboardingStatus } from '@/services/members/types';
import Cookies from 'js-cookie';

const USE_MOCK_DATA = true;

async function fetcher(uid: string | undefined): Promise<ProfileOnboardingStatus | null> {
  if (!uid) return null;

  if (USE_MOCK_DATA)
    return {
      type: 'investor_onborading',
      steps: [
        {
          type: 'verify_linkedIn',
          state: 'done',
          actions: [
            {
              type: 'confirm_identity',
              state: 'done',
            },
          ],
        },
        {
          type: 'setup_investor_profile',
          state: 'done',
          actions: [
            {
              type: 'update_investor_profile',
              state: 'done',
            },
            {
              type: 'update_contact_details',
              state: 'done',
            },
          ],
        },
        {
          type: 'additional_details',
          state: 'pending',
          actions: [
            {
              type: 'add_bio',
              state: 'done',
            },
            {
              type: 'add_additional_teams',
              state: 'pending',
            },
          ],
        },
        {
          type: 'notification_preferences',
          state: 'pending',
          actions: [
            {
              type: 'manage_notifications',
              state: 'pending',
            },
          ],
        },
      ],
    };

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/member/${uid}/profile-status`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch profile onboarding status');
  }

  return await response.json();
}

export function useProfileOnboardingStatus(uid: string | undefined) {
  const authToken = Cookies.get('authToken') || '';

  return useQuery({
    queryKey: [MembersQueryKeys.GET_PROFILE_ONBOARDING_STATUS, uid],
    queryFn: () => fetcher(uid),
    enabled: Boolean(uid) && Boolean(authToken),
  });
}
