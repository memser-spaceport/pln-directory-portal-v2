import { useQuery } from '@tanstack/react-query';
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
};

async function fetcher() {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current/fundraising-profile`;

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

  const videoResponse = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/uploads/${data.videoUploadUid}`,
    {
      method: 'GET',
    },
    true,
  );

  if (videoResponse?.ok) {
    data.videoUpload = await videoResponse.json();
    if (data.videoUpload?.freshUrl) {
      data.videoUpload.url = data.videoUpload?.freshUrl;
    }
  }

  const slideResponse = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/uploads/${data.onePagerUploadUid}`,
    {
      method: 'GET',
    },
    true,
  );

  if (slideResponse?.ok) {
    data.onePagerUpload = await slideResponse.json();
    if (data.onePagerUpload?.freshUrl) {
      data.onePagerUpload.url = data.onePagerUpload.freshUrl;
    }
  }

  return data;

  // return {
  //   image: '/images/demo-day/profile-placeholder.svg',
  //   name: 'Randamu',
  //   shortDescription: 'Randamu increases fairness in our world by harnessing entropy.',
  //   tags: ['VR/AR', 'Frontier Tech', 'Service Providers', 'Enterprise Solutions'],
  //   fundingStage: 'seed',
  //   pitchDeckUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Sample PDF
  //   videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Sample video
  // };
}

export function useGetFundraisingProfile() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE],
    queryFn: fetcher,
  });
}
