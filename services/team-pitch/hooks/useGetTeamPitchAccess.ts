import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { customFetch } from '@/utils/fetch-wrapper';
import { useCurrentUserStore } from '@/services/auth/store';
import { TeamPitchQueryKeys } from '@/services/team-pitch/constants';

export type TeamPitchAccess = {
  uid: string;
  slug: string;
  createdAt: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  title: string;
  description: string;
  supportEmail: string;
  logoUrl: string | null;
  primaryColor: string;
  headerImageUrl: string | null;
  access: 'restricted' | 'view' | 'edit';
  participantAccess: 'VIEW' | 'VIEW_ADMIN' | 'EDIT' | 'RESTRICTED' | null;
  participantType: 'INVESTOR' | 'FOUNDER' | 'SUPPORT' | null;
  isPitchAdmin: boolean;
  confidentialityAccepted: boolean;
  teamUid: string;
  teamName: string;
};

export async function getTeamPitchAccess(slug: string, authenticated: boolean) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-pitches/${slug}/access`;
  const response = await customFetch(url, { method: 'GET' }, authenticated);
  if (!response?.ok) {
    throw new Error('Failed to fetch team pitch access');
  }
  return (await response.json()) as TeamPitchAccess;
}

export function useGetTeamPitchAccess(slug?: string) {
  const params = useParams();
  const pitchSlug = slug ?? (params.slug as string);
  const { currentUser, isHydrated } = useCurrentUserStore();

  return useQuery({
    queryKey: [TeamPitchQueryKeys.ACCESS, pitchSlug, currentUser?.uid],
    queryFn: () => getTeamPitchAccess(pitchSlug, !!currentUser?.uid),
    enabled: !!pitchSlug && isHydrated,
  });
}
