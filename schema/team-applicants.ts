import { z } from 'zod';

/**
 * The wire contract for a team's own applicants — what a team lead reads about
 * the people who answered their postings.
 *
 * Everything else under `/v1/job-openings` is viewer-scoped ("my applications",
 * "my interests"). This is the other direction, and the only team-scoped read
 * that exists today is the ATS candidates feed, which is behind an integration
 * key rather than a member JWT. So these shapes are a PROPOSAL until LAB-2580
 * lands, and `services/jobs/team-applicants.mock.ts` stands in for the server
 * meanwhile.
 *
 * They are deliberately close to the backend's own `candidate-rows.ts`
 * (`CandidateApplicationRow` / `CandidateInterestRow`), which already maps this
 * field set for the ATS feed and the ATS push. Whoever implements LAB-2580
 * should map through that module rather than writing a second candidate shape:
 * its header makes the point that two shapes for one uid means the ATS has two
 * sources of truth, and a team-facing read would make it three.
 *
 * `.strict()` throughout, the reason `schema/job-interests.ts` gives: a field
 * the server sends and this schema has never heard of fails loudly here rather
 * than arriving as `undefined` three components later.
 */

/**
 * The CV that travelled with an application, named and sized so
 * `CvAttachmentLine` can draw it before the signed URL has been fetched.
 *
 * Mirrors `StoredCv` (`components/common/profile/StoredCv/types.ts`) rather
 * than inventing a second file shape, `size` optional for the reason that type
 * gives: `MemberCvImport` has no size column, so the API reads it from S3 at
 * serve time and that read is allowed to fail on its own.
 *
 * No `url` here. The link expires, so it is fetched when the reader asks for
 * the file — the same split the ATS feed makes with
 * `GET /v1/integrations/candidates/applications/:uid/cv`.
 */
export const applicantCvSchema = z
  .object({
    fileName: z.string().min(1),
    size: z.number().optional(),
    uploadedAt: z.string().min(1),
  })
  .strict();

/**
 * One person in one of the two lists.
 *
 * The SAME shape for an application and an interest, because the page shows
 * them in the same row and the same pane — the difference is that an interest
 * carries no `coverLetter` and, usually, no `cv`. Two schemas would have to
 * make `coverLetter` optional on both, which is how a missing note stops being
 * a distinction the UI can draw.
 *
 * Deliberately THIN: name, headline, and the act. The whole member profile is
 * NOT here — the pane fetches it with the ordinary member query, so there is
 * exactly one description of a member in the app and this list cannot drift
 * from `/members/[id]`.
 */
export const applicantRowSchema = z
  .object({
    /** The application/interest row's own uid — what `reviewed` and `seen` write against. */
    uid: z.string().min(1),
    memberUid: z.string().min(1),
    name: z.string().min(1),
    /** Null when the member has no email on record; **Email <name>** hides itself. */
    email: z.string().nullable(),
    /** Absolute — the backend composes it, so a link out of an ATS and a link
     *  out of this page agree. The page itself routes by `memberUid`. */
    profileUrl: z.string().min(1),
    /** Null for a member with no picture; the row draws initials instead. */
    avatarUrl: z.string().nullable(),
    /** "Protocol Engineer" — their current role, not the one they applied for. */
    headline: z.string().nullable(),
    currentCompany: z.string().nullable(),
    location: z.string().nullable(),
    tags: z.array(z.string()),
    /** ISO. `appliedAt` for an application, `interestedAt` for an interest —
     *  one name, because every reader of it asks the same question ("when"). */
    createdAt: z.string().min(1),
    /** What they wrote. Always null on an interest: the press carries no words. */
    coverLetter: z.string().nullable(),
    cv: applicantCvSchema.nullable(),
    /**
     * Not opened by THIS viewer — per-lead, not per-row.
     *
     * A shared "viewed" column would blank the badge for a co-lead who has not
     * looked, which is the badge lying about the only thing it claims.
     */
    unseen: z.boolean(),
    /**
     * The TEAM's own tick — shared, unlike `unseen`.
     *
     * It is the team saying they have dealt with this person, which is not a
     * per-lead fact. And it is not a pipeline stage: there is no Shortlist or
     * Reject, because this product replies by email and the list is a record of
     * who applied, not a board to move people across.
     */
    reviewed: z.boolean(),
  })
  .strict();

/** A role's tallies, for the profile's count line and the picker's `● M new`. */
export const applicantCountSchema = z
  .object({
    roleUid: z.string().min(1),
    applicantCount: z.number(),
    interestCount: z.number(),
    /** Unopened by this viewer, across BOTH lists. */
    newCount: z.number(),
    /**
     * Up to three pictures, newest first, for the profile's facepile.
     *
     * On the count rather than fetched per role: the line renders inside a
     * `memo`'d list of rows, and a query per row would be a request per row.
     * Entries are URLs only — a face is all the line shows, and a name here
     * would put the people who applied on a page the lead's own teammates read
     * over their shoulder.
     */
    newestAvatars: z.array(z.string()).max(3),
  })
  .strict();

/**
 * Counts for every open role the team has.
 *
 * Counts only — the roles themselves come from the jobs list the team profile
 * already fetches (`getJobsList(teamUid=…)`). Returning role titles and
 * seniority here too would be a second description of a posting, and the first
 * one is already the thing the board renders.
 *
 * A role absent from `counts` has nobody. The list is complete, so absence is
 * an answer rather than an unknown — the same rule the viewer-side interest map
 * relies on.
 */
export const applicantCountsResponseSchema = z
  .object({
    counts: z.array(applicantCountSchema),
  })
  .strict();

/** One role's two lists, newest first. */
export const roleApplicantsResponseSchema = z
  .object({
    applications: z.array(applicantRowSchema),
    interests: z.array(applicantRowSchema),
  })
  .strict();

/**
 * The authoritative post-write state, which is what makes it worth parsing.
 * Both directions answer the same shape, so a second press on an already-marked
 * row reports that nothing changed instead of erroring about it.
 */
export const applicantReviewedResponseSchema = z
  .object({
    uid: z.string().min(1),
    reviewed: z.boolean(),
  })
  .strict();

/** Marking a row opened. Idempotent; the first `seenAt` stands. */
export const applicantSeenResponseSchema = z
  .object({
    uid: z.string().min(1),
    seenAt: z.string().min(1),
  })
  .strict();

export type ApplicantCv = z.infer<typeof applicantCvSchema>;
export type ApplicantRow = z.infer<typeof applicantRowSchema>;
export type ApplicantCount = z.infer<typeof applicantCountSchema>;
export type ApplicantReviewedResult = z.infer<typeof applicantReviewedResponseSchema>;
export type ApplicantSeenResult = z.infer<typeof applicantSeenResponseSchema>;

/**
 * Which list a row came from.
 *
 * NOT on the wire: the response already separates `applications` from
 * `interests`, so sending it would be the server repeating in every row what it
 * said once in the envelope — and `.strict()` would then reject a server that
 * sensibly left it out. The service tags rows as it parses them, because a row
 * handed to a component has lost the envelope it arrived in and still has to
 * know which `reviewed` endpoint it writes to.
 */
export type ApplicantKind = 'application' | 'interest';

/** A row with the list it came from, which is what every component receives. */
export type TeamApplicant = ApplicantRow & { kind: ApplicantKind };
