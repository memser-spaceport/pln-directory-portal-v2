import type { ISavedJob } from '@/types/jobs.types';

export function toggleSavedJobInCache(current: ISavedJob[], roleUid: string, saved: boolean): ISavedJob[] {
  if (saved) {
    return current.filter((savedJob) => savedJob.jobUid !== roleUid);
  }

  return [{ jobUid: roleUid, savedAt: new Date().toISOString() }, ...current];
}
