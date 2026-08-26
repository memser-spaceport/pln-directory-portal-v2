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

  return formatExperience(experiences);
}

/**
 * @param options.enabled Hold the request back until the caller says it matters.
 *   Defaults to on, which is what every section-level caller wants — they only
 *   mount once their card is on screen. `JobProfileDrawer` is the exception: it
 *   is mounted (closed) beside the job board and needs the row count for its own
 *   layout decision, so without this it would fetch every member's experience
 *   for a drawer nobody opened.
 */
export function useMemberExperience(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER_EXPERIENCE, id],
    queryFn: () => fetcher(id),
    enabled: options?.enabled ?? true,
  });
}
