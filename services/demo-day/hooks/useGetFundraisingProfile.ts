import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

async function fetcher() {
  return {
    image: '/images/demo-day/profile-placeholder.svg',
    name: 'Randamu',
    shortDescription: 'Randamu increases fairness in our world by harnessing entropy.',
    tags: ['VR/AR', 'Frontier Tech', 'Service Providers', 'Enterprise Solutions'],
    fundingStage: 'seed',
  };
}

export function useGetFundraisingProfile() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_FUNDRAISING_PROFILE],
    queryFn: fetcher,
  });
}
