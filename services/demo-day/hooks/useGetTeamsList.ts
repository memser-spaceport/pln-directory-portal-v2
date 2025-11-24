import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import Cookies from 'js-cookie';

export type TeamProfile = {
  createdAt: string;
  demoDayUid: string;
  lastModifiedBy: string;
  onePagerUpload: UploadInfo;
  onePagerUploadUid: string;
  status: string;
  team: {
    fundingStage: { uid: string; title: string };
    industryTags: { uid: string; title: string }[];
    logo: { uid: 'cmfo0qukn0007p166rz8vu3rm'; url: string };
    name: string;
    shortDescription: string;
    uid: string;
    website?: string;
  };
  teamUid: string;
  uid: string;
  updatedAt: string;
  videoUpload: UploadInfo;
  videoUploadUid: string;
  founders: {
    email: string;
    image: { url: string } | null;
    name: string;
    officeHours: null;
    role: string;
    skills: { uid: string; title: string }[];
    uid: string;
  }[];
  description: string | null;
  liked: boolean;
  connected: boolean;
  invested: boolean;
  referral: boolean;
};

export type TeamsListResponse = TeamProfile[];

async function fetcher(demoDayId: string): Promise<TeamsListResponse> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profiles`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day teams list');
  }

  const data: TeamsListResponse = await response.json();

  return data;
}

export function useGetTeamsList() {
  const authToken = Cookies.get('authToken') || '';
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST, demoDayId],
    queryFn: () => fetcher(demoDayId),
    enabled: Boolean(authToken) && !!demoDayId,
  });
}
