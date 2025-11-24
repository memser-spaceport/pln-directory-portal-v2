import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type UploadInfo = {
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
  previewImageUrl: string;
  previewImageSmallUrl: string;
};

export type FundraisingProfile = {
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
    website?: string;
  };
  onePagerUploadUid: string | null;
  onePagerUpload: UploadInfo | null;
  videoUploadUid: string | null;
  videoUpload: UploadInfo | null;
  founders?: {
    email: string;
    image: { uid: string; url: string } | null;
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
};

async function fetcher(demoDayId: string) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDayId}/fundraising-profile`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day fundraising profile');
  }

  const data: FundraisingProfile = await response.json();

  return data;
}

export function useGetFundraisingProfile(enabled: boolean = true) {
  const params = useParams();
  const demoDayId = params.demoDayId as string;

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE, demoDayId],
    queryFn: () => fetcher(demoDayId),
    enabled: enabled && !!demoDayId,
  });
}
