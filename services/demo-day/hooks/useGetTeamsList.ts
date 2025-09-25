import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { UploadInfo } from '@/services/demo-day/hooks/useGetFundraisingProfile';

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
};

export type TeamsListResponse = TeamProfile[];

async function fetcher(): Promise<TeamsListResponse> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profiles`;

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
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_TEAMS_LIST],
    queryFn: fetcher,
  });
}
