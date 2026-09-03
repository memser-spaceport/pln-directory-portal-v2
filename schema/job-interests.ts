import { z } from 'zod';

/**
 * The wire contract for "I'm interested" on a job opening.
 *
 * Written to mirror `jobApplicationSchema` next door, because the two answer
 * the same question about the same pair of ids — "has this member acted on this
 * role" — and a reader who knows one should not have to learn the other.
 *
 * **Provisional.** The endpoint is being written as this ships; nothing here has
 * been checked against a live response. That is exactly why it is `.strict()`:
 * a field the server sends and this schema does not know about fails loudly on
 * dev, behind the flag, instead of arriving as `undefined` three components
 * later. Same reasoning the applications schema records for itself.
 */

export const jobInterestSchema = z
  .object({
    /** The interest row's own id — not the job's. */
    uid: z.string().min(1),
    /** The job opening. Named `jobUid` server-side; the board calls the same
     *  identifier a role uid. */
    jobUid: z.string().min(1),
    /** ISO timestamp. */
    createdAt: z.string().min(1),
  })
  .strict();

/** The viewer's COMPLETE interested list, so cache-absence means not interested. */
export const jobInterestListResponseSchema = z
  .object({
    interests: z.array(jobInterestSchema),
  })
  .strict();

export type JobInterest = z.infer<typeof jobInterestSchema>;
