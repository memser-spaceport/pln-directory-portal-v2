import { z } from 'zod';

/**
 * The wire contract for in-app job applications, mirroring
 * `libs/contracts/src/schema/job-application.ts` on the backend.
 *
 * These schemas were written before the API existed and the mock parsed its
 * fixtures through them; now the real responses parse through the same ones.
 * That is the point of having kept them: they are the boundary where a shape
 * that drifts from the contract fails loudly instead of arriving as
 * `undefined` three components later.
 */

export const jobApplicationSchema = z
  .object({
    /** The application's own id — not the job's. */
    uid: z.string().min(1),
    /** The job opening applied to. Named `jobUid` server-side; the board calls
     *  the same identifier a role uid. */
    jobUid: z.string().min(1),
    /** ISO timestamp. */
    appliedAt: z.string().min(1),
  })
  .strict();

/** The viewer's COMPLETE applied list, so cache-absence means not-applied. */
export const jobApplicationListResponseSchema = z
  .object({
    applications: z.array(jobApplicationSchema),
  })
  .strict();

/**
 * The apply body carries the letter and nothing else — the job uid travels in
 * the path (`POST /v1/job-openings/:uid/applications`). Length is enforced
 * server-side too; this keeps the client from spending a round trip to be told.
 */
export const submitJobApplicationInputSchema = z
  .object({
    coverLetter: z.string().trim().min(1).max(2000),
  })
  .strict();

/**
 * Job-board sign-up. Deliberately NOT the participants-request payload — the
 * board has its own endpoint now, and the backend contract says not to use the
 * old one.
 *
 * `team` is optional: omitted means no company affiliation, `{ uid }` picks an
 * existing team, and `isTeamNew` with `{ name }` creates one.
 */
export const jobBoardSignUpInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email(),
    role: z.string().trim().min(1).max(200),
    linkedinHandler: z.string().trim().min(1).max(200).optional(),
    isTeamNew: z.boolean().optional(),
    team: z
      .object({
        uid: z.string().min(1).optional(),
        name: z.string().min(1).max(200).optional(),
        website: z.string().min(1).max(500).optional(),
      })
      .optional(),
  })
  .strict();

export const jobBoardSignUpResponseSchema = z.object({ uid: z.string() });

export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type SubmitJobApplicationInput = z.infer<typeof submitJobApplicationInputSchema>;
export type JobBoardSignUpInput = z.infer<typeof jobBoardSignUpInputSchema>;
