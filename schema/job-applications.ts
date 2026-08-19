import { z } from 'zod';
import { JOB_SEARCH_STATUS_OPTIONS, JobSearchStatus } from '@/services/jobs/job-board-viewer';

/**
 * The wire contract for in-app job applications, defined BEFORE the backend
 * exists: the mock fetchers `parse` their fixtures through these schemas, and
 * the real fetchers written at cutover parse responses through the same ones —
 * so mock drift is a dev-time error and the cutover changes only the transport
 * line. `.strict()` on purpose: the jobs API's non-strict schemas have already
 * shipped silent field drops; these fail loudly instead.
 */

const JOB_SEARCH_STATUS_VALUES = JOB_SEARCH_STATUS_OPTIONS.map((o) => o.value) as [
  JobSearchStatus,
  ...JobSearchStatus[],
];

export const jobSearchStatusSchema = z.enum(JOB_SEARCH_STATUS_VALUES);

export const jobApplicationSchema = z
  .object({
    roleUid: z.string().min(1),
    teamUid: z.string().min(1),
    /** ISO timestamp. */
    appliedAt: z.string().min(1),
  })
  .strict();

/** The viewer's COMPLETE applied list — never filled incrementally, so absent = not applied. */
export const jobApplicationsResponseSchema = z.array(jobApplicationSchema);

export const submitJobApplicationInputSchema = z
  .object({
    roleUid: z.string().min(1),
    teamUid: z.string().min(1),
    /** Plain text end-to-end. Length limit is enforced server-side at cutover. */
    coverLetter: z.string().trim().min(1),
  })
  .strict();

export const jobSearchStatusResponseSchema = z
  .object({
    jobSearchStatus: jobSearchStatusSchema.nullable(),
  })
  .strict();

export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type SubmitJobApplicationInput = z.infer<typeof submitJobApplicationInputSchema>;
