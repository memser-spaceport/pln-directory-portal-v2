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

/**
 * The headers a role's requirements sit under (LAB-2854), in the order the
 * Edit criteria modal and the Why suggested pane show them.
 */
export const CRITERION_GROUPS = ['Skills', 'Experience', 'Seniority', 'Location', 'Other'] as const;
export type CriterionGroup = (typeof CRITERION_GROUPS)[number];

const isCriterionGroup = (value: unknown): value is CriterionGroup =>
  (CRITERION_GROUPS as readonly unknown[]).includes(value);

/**
 * A requirement's group (LAB-2854). Absent (or null) on a backend that does
 * not group yet, and the page then lists the requirements without headers.
 * A value this page has never heard of is read as `Other` rather than failing
 * the parse: a sixth group added on the server must not cost the whole tab.
 */
const criterionGroupSchema = z.preprocess(
  (value) => (value === undefined || value === null ? undefined : isCriterionGroup(value) ? value : 'Other'),
  z.enum(CRITERION_GROUPS).optional(),
);

/**
 * The short name over the requirement's full statement (LAB-2854), at most 40
 * characters on the server. Absent on an older backend; `text` stays the
 * statement and the key either way.
 */
const criterionLabelSchema = z.string().nullable().optional();

/** One of the role's requirements, and whether this profile shows it. */
export const suggestedCriterionSchema = z
  .object({
    text: z.string().min(1),
    matched: z.boolean(),
    label: criterionLabelSchema,
    group: criterionGroupSchema,
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
    /**
     * When a lead of this team contacted the member about this role through the
     * platform (LAB-2846), or null. Optional so an older backend without it
     * still parses.
     */
    contactedAt: z.string().nullable().optional(),
  })
  .strict();

/**
 * One of the ROLE's requirements and whether the team counts it when matching
 * (LAB-2846). Not the same thing as `suggestedCriterionSchema`, which says
 * whether one person meets a requirement. Keyed by its text (the full
 * statement): the contract sends no ids, and `PUT match-criteria` names the
 * switched-off ones by text — also once the backend sends `label` and `group`
 * (LAB-2854), which are for display only.
 */
export const roleCriterionSchema = z
  .object({
    text: z.string().min(1),
    enabled: z.boolean(),
    label: criterionLabelSchema,
    group: criterionGroupSchema,
  })
  .strict();

export const suggestedCandidatesResponseSchema = z
  .object({
    suggestions: z.array(suggestedCandidateSchema),
    /**
     * The role's requirements with their on/off switch. `[]` for a role that is
     * not live or a posting with no extracted criteria; absent on an older
     * backend. Optional, so both backends parse.
     */
    criteria: z.array(roleCriterionSchema).optional(),
    /**
     * The lead's own words about who they are looking for (LAB-2853), or null
     * when none is saved. Absent on a backend without it, so it is optional.
     */
    criteriaPrompt: z.string().nullable().optional(),
  })
  .strict();

/**
 * `PUT /v1/job-openings/:roleUid/match-criteria` answers the role's criteria
 * and the saved prompt (LAB-2853). `prompt` is optional so a backend that does
 * not have it yet still parses.
 */
export const matchCriteriaResponseSchema = z
  .object({
    criteria: z.array(roleCriterionSchema),
    prompt: z.string().nullable().optional(),
  })
  .strict();

/** The longest prompt the match-criteria endpoint takes, after trimming (LAB-2853). */
export const CRITERIA_PROMPT_MAX_LENGTH = 500;

/** `POST …/suggested-candidates/:memberUid/contact` answers when the message went out. */
export const contactSuggestedResponseSchema = z
  .object({
    contactedAt: z.string().min(1),
  })
  .strict();

/** The message limit the contact endpoint enforces after trimming. */
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;

/** The only two bands a team ever sees. A weak match is never shown. */
export const SUGGESTION_LABELS = ['Strong match', 'Good match'] as const;
export type SuggestionLabel = (typeof SUGGESTION_LABELS)[number];

/** Five is a list a lead finishes. The server caps it too; this is the page's own promise. */
export const SUGGESTED_LIMIT = 5;

export type SuggestedCriterion = z.infer<typeof suggestedCriterionSchema>;
export type RoleCriterion = z.infer<typeof roleCriterionSchema>;
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
