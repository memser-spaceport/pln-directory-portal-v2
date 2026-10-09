import { z } from 'zod';

/**
 * The wire contract for a role's suggested candidates (LAB-2771) — members the
 * product proposes for a live role, as the hiring team reads them.
 *
 * Mirrors `SuggestedCandidate` in the backend's `job-match.service.ts`
 * (`GET /v1/job-openings/:roleUid/suggested-candidates`, LAB-2770). The server
 * already does the work this screen promises: the top 5 per role, best first,
 * nobody under the weak-match floor, and nobody who is or was on the team.
 *
 * `.strict()` for the reason `schema/team-applicants.ts` gives: a field the
 * server sends and this schema has never heard of fails loudly here.
 *
 * `label` is a plain string on purpose, not an enum of the two bands. The
 * service drops any row whose label is not one of `SUGGESTION_LABELS`, so a
 * third band added on the server ("Weak match") costs that row and not the
 * whole tab.
 */

/** One of the role's requirements, and whether this profile shows it. */
export const suggestedCriterionSchema = z
  .object({
    text: z.string().min(1),
    matched: z.boolean(),
  })
  .strict();

export const suggestedCandidateSchema = z
  .object({
    memberUid: z.string().min(1),
    name: z.string().min(1),
    /** Their current role, from the profile. */
    role: z.string().nullable(),
    imageUrl: z.string().nullable(),
    /** Whole percent of the role's criteria the profile meets. */
    fit: z.number(),
    label: z.string(),
    /** 1 is the best match. */
    rank: z.number(),
    /** One sentence on why they were suggested, when the matcher wrote one. */
    blurb: z.string().nullable(),
    criteria: z.array(suggestedCriterionSchema),
    /** The member said they are interested in this role or its team (LAB-2788, backend #3493). Optional until that ships. */
    interested: z.boolean().optional(),
    /** The note the member wrote with their interest, when they wrote one (LAB-2789). Optional until the backend sends it. */
    note: z.string().nullable().optional(),
  })
  .strict();

export const suggestedCandidatesResponseSchema = z
  .object({
    suggestions: z.array(suggestedCandidateSchema),
  })
  .strict();

/** The only two bands a team ever sees. A weak match is never shown. */
export const SUGGESTION_LABELS = ['Strong match', 'Good match'] as const;
export type SuggestionLabel = (typeof SUGGESTION_LABELS)[number];

/** Five is a list a lead finishes. The server caps it too; this is the page's own promise. */
export const SUGGESTED_LIMIT = 5;

export type SuggestedCriterion = z.infer<typeof suggestedCriterionSchema>;
export type SuggestedCandidate = Omit<z.infer<typeof suggestedCandidateSchema>, 'label'> & { label: SuggestionLabel };

export const isSuggestionLabel = (label: string): label is SuggestionLabel =>
  (SUGGESTION_LABELS as readonly string[]).includes(label);

/**
 * What the page shows: known bands only, best match first, at most five.
 *
 * Not a re-rank — the server's `rank` is the order. It is applied here again
 * because the acceptance criteria are the page's ("at most 5", "Weak match
 * never appears"), and a guard costs one line.
 */
export function selectShownSuggestions(rows: z.infer<typeof suggestedCandidateSchema>[]): SuggestedCandidate[] {
  return rows
    .filter((row): row is SuggestedCandidate => isSuggestionLabel(row.label))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, SUGGESTED_LIMIT);
}
