import { z } from 'zod';

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
    .min(COMMUNITY_TRACK.messageMin, {
      message: `Message must be at least ${COMMUNITY_TRACK.messageMin} characters`,
    })
    .max(COMMUNITY_TRACK.messageMax, {
      message: `Message must be ${COMMUNITY_TRACK.messageMax} characters or fewer`,
    }),
});

export type CommunityKudosFormValues = z.infer<typeof communityKudosSchema>;
