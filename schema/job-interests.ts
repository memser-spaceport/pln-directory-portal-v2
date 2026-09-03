import { z } from 'zod';

/**
 * The wire contract for "I'm interested" on a job opening.
 *
 * Mirrors `schema/job-applications.ts` next door, because the two answer the
 * same question about the same pair of ids — "has this member acted on this
 * role" — and a reader who knows one should not have to learn the other.
 *
 * `.strict()` on both, same reason the applications schemas give: a field the
 * server sends and this schema has never heard of fails loudly here rather than
 * arriving as `undefined` three components later.
 *
 * **Note the path asymmetry, which is the server's and not a typo here.**
 * Writing is `/:uid/interest` (singular); reading the viewer's own list is
 * `/interests` (plural). See `job-interests.service.ts`.
 */

export const jobInterestSchema = z
  .object({
    /** The interest row's own id — not the job's. */
    uid: z.string().min(1),
    /** The job opening. Named `jobUid` server-side; the board calls the same
     *  identifier a role uid. */
    jobUid: z.string().min(1),
    /** ISO timestamp. Named for the act, not the row — `interestedAt`, where the
     *  application's equivalent is `appliedAt`. */
    interestedAt: z.string().min(1),
  })
  .strict();

/** The viewer's COMPLETE interested list, so cache-absence means not interested. */
export const jobInterestListResponseSchema = z
  .object({
    interests: z.array(jobInterestSchema),
  })
  .strict();

/**
 * What marking or unmarking answers with — the same shape for both verbs.
 *
 * It is the authoritative post-write state, which is what makes it worth
 * parsing rather than discarding: both endpoints are idempotent, so this is how
 * a second press on an already-marked role reports that nothing changed instead
 * of erroring about it.
 *
 * `interestedCount` is the role's total across all members. Nothing in the
 * design shows it — the banner says "the team will be notified", not "you and
 * eleven others" — so it is parsed and deliberately not rendered. Typed anyway,
 * because a field that exists on the wire and is absent from the schema is a
 * `.strict()` failure waiting for whoever adds the UI.
 */
export const jobInterestToggleResponseSchema = z
  .object({
    jobUid: z.string().min(1),
    interestedCount: z.number(),
    viewerIsInterested: z.boolean(),
  })
  .strict();

export type JobInterest = z.infer<typeof jobInterestSchema>;
export type JobInterestToggle = z.infer<typeof jobInterestToggleResponseSchema>;
