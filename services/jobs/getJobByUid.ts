import type { IJobRole, IJobTeam, IJobsListResponse } from '@/types/jobs.types';

export interface JobWithTeam {
  role: IJobRole;
  team: IJobTeam;
}

export async function getJobByUid(jobUid: string): Promise<JobWithTeam | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/job-openings?jobUid=${encodeURIComponent(jobUid)}`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });

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
