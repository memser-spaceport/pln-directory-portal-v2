import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type TeamProfile = {
  uid: string;
  teamUid: string;
  team: {
    uid: string;
    name: string;
    shortDescription: string;
    industryTags: {
      uid: string;
      title: string;
    }[];
    fundingStage: {
      uid: string;
      title: string;
    };
    logo: { uid: string; url: string } | null;
  };
  onePagerUploadUid: string | null;
  onePagerUpload: {
    bucket: null;
    checksum: string;
    cid: null;
    createdAt: string;
    filename: string;
    key: string;
    kind: string;
    meta: null;
    mimetype: string;
    scopeType: string;
    scopeUid: string | null;
    size: number;
    status: string;
    storage: string;
    uid: string;
    updatedAt: string;
    uploaderUid: string | null;
    url: string;
    freshUrl: string;
  } | null;
  videoUploadUid: string | null;
  videoUpload: {
    bucket: null;
    checksum: string;
    cid: null;
    createdAt: string;
    filename: string;
    key: string;
    kind: string;
    meta: null;
    mimetype: string;
    scopeType: string;
    scopeUid: string | null;
    size: number;
    status: string;
    storage: string;
    uid: string;
    updatedAt: string;
    uploaderUid: string | null;
    url: string;
    freshUrl: string;
  } | null;
  founders?: {
    email: string;
    image: { uid: string; url: string } | null;
    name: string;
    officeHours: null;
    role: string;
    skills: { uid: string; title: string }[];
    uid: string;
  }[];
};

export type TeamsListResponse = TeamProfile[];

async function fetcher(): Promise<TeamsListResponse> {
  const url = `http://localhost:3000/v1/demo-days/current/fundraising-profiles`;

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
