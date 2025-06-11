import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getAllMemberExperiences } from '@/services/members-experience.service';

export type FormattedMemberExperience = {
  company: string;
  description: string;
  endDate: string;
  isCurrent: boolean;
  isFlaggedByUser: boolean;
  location: string;
  memberId: string;
  startDate: string;
  title: string;
  uid: string;
};

const formatExperience = (experiences: any): FormattedMemberExperience[] => {
  return experiences.map((experience: any) => {
    return {
      memberId: experience?.memberUid,
      company: experience?.company,
      title: experience?.title,
      startDate: experience?.startDate ? experience?.startDate : new Date().toISOString(),
      endDate: experience?.endDate ? experience?.endDate : new Date().toISOString(),
      isCurrent: experience?.isCurrent,
      location: experience?.location,
      uid: experience?.uid ?? '',
      isFlaggedByUser: experience?.isFlaggedByUser ?? false,
      description: experience?.description ?? '',
    };
  });
};

async function fetcher(id: string) {
  const experiences = await getAllMemberExperiences(id);

  console.log(experiences);
  return formatExperience(experiences);
}

export function useMemberExperience(id: string) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER_EXPERIENCE, id],
    queryFn: () => fetcher(id),
  });
}
