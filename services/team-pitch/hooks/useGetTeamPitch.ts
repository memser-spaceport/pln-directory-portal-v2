import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { useCurrentUserStore } from '@/services/auth/store';
import { TeamPitchQueryKeys } from '@/services/team-pitch/constants';
import type { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { withOnePagerS3Urls } from '@/utils/upload-url.utils';

export type TeamPitchFull = {
  uid: string;
  slug: string;
  status: string;
  closedAt?: string | null;
  title: string;
  description: string;
  supportEmail: string;
  primaryColor: string;
  logoUrl: string | null;
  headerImageUrl: string | null;
  access: string;
  participantType: string | null;
  confidentialityAccepted: boolean;
  teamProfile: TeamProfile | null;
  team?: { uid: string; name: string };
};

export async function getTeamPitch(slug: string) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-pitches/${slug}`;
  const response = await customFetch(url, { method: 'GET' }, true);
  if (response?.status === 404) {
    return null;
  }
  if (!response?.ok) {
    throw new Error('Failed to fetch team pitch');
  }
  const data = (await response.json()) as TeamPitchFull;

  if (data.teamProfile) {
    data.teamProfile = withOnePagerS3Urls(data.teamProfile);
  }

  return data;
}

export function useGetTeamPitch(slug?: string, enabled = true) {
  const params = useParams();
  const pitchSlug = slug ?? (params.slug as string);
  const { currentUser } = useCurrentUserStore();

  return useQuery({
    queryKey: [TeamPitchQueryKeys.PITCH, pitchSlug, currentUser?.uid],
    queryFn: () => getTeamPitch(pitchSlug),
    enabled: !!pitchSlug && enabled && !!currentUser?.uid,
  });
}
