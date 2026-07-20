import { z } from 'zod';

/**
 * Community Kudos form schema.
 *
 * Wired into React Hook Form via `@hookform/resolvers/zod`. The API service
 * should mirror this schema (or import a shared package) so client-side and
 * server-side validation cannot drift.
 *
 * Pattern matches the rest of the repo (member-forms.ts, team-forms.ts,
 * project-form.ts): `errorMap: () => ({ message })` for the top-level error
 * and `.trim().min().max()` for strings.
 *
 * Note: the recipient is referenced by stable memberId (a string id), never by
 * a free-text display name — the server resolves and validates it against the
 * active member directory.
 */

import { COMMUNITY_TRACK } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.data';

export const communityKudosSchema = z.object({
  recipientId: z
    .string({ errorMap: () => ({ message: 'Please select a recipient' }) })
    .min(1, { message: 'Please select a recipient' }),
  points: z
    .number({ errorMap: () => ({ message: 'Please select an amount' }) })
    .int()
    .min(COMMUNITY_TRACK.minGift, { message: `Minimum gift is ${COMMUNITY_TRACK.minGift} points` })
    .max(COMMUNITY_TRACK.maxGift, { message: `Maximum gift is ${COMMUNITY_TRACK.maxGift} points` })
    .refine((v) => v % COMMUNITY_TRACK.increment === 0, {
      message: `Points must be in ${COMMUNITY_TRACK.increment}-point increments`,
    }),
  message: z
    .string({ errorMap: () => ({ message: 'Please write a message' }) })
    .trim()
    .min(1, { message: 'Please write a message' })
    .max(400, { message: 'Message must be 400 characters or fewer' }),
});

export type CommunityKudosFormValues = z.infer<typeof communityKudosSchema>;
