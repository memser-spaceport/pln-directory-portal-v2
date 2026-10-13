import type { IJobRole, IJobTeam, IJobsListResponse } from '@/types/jobs.types';

export interface JobWithTeam {
  role: IJobRole;
  team: IJobTeam;
}

export async function getJobByUid(jobUid: string): Promise<JobWithTeam | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/job-openings?jobUid=${encodeURIComponent(jobUid)}`;

  try {
    /* Five minutes, which is what `get-job-by-uid` asserts and names. It was
       changed to 60 in `9b9256ed1` — a 23-file commit about screenshot feedback
       in which this was the only jobs file touched, unmentioned in the message,
       and it left develop's test suite red. Restored rather than followed: a
       five-fold increase in revalidation across every job page is a decision,
       and nothing recorded one. */
    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      return null;
    }

    const { groups } = (await response.json()) as IJobsListResponse;
    const group = groups?.[0];
    const role = group?.roles?.find((item) => item.uid === jobUid);

    return role ? { role, team: group.team } : null;
  } catch {
    return null;
  }
}
