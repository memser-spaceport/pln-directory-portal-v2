import { z } from 'zod';

/** Gift-amount limits, fetched live from the community pool. */
export interface CommunityKudosLimits {
  pointsMin: number;
  pointsMax: number;
  pointsStep: number;
  messageMin: number;
  messageMax: number;
}

export function buildCommunityKudosSchema(limits: CommunityKudosLimits) {
  return z.object({
    recipientId: z
      .string({ errorMap: () => ({ message: 'Please select a recipient' }) })
      .min(1, { message: 'Please select a recipient' }),
    points: z
      .number({ errorMap: () => ({ message: 'Please select an amount' }) })
      .int()
      .min(limits.pointsMin, { message: `Minimum gift is ${limits.pointsMin} points` })
      .max(limits.pointsMax, { message: `Maximum gift is ${limits.pointsMax} points` })
      .refine((v) => v % limits.pointsStep === 0, {
        message: `Points must be in ${limits.pointsStep}-point increments`,
      }),
    message: z
      .string({ errorMap: () => ({ message: 'Please write a message' }) })
      .trim()
      .min(limits.messageMin, {
        message: `Message must be at least ${limits.messageMin} characters`,
      })
      .max(limits.messageMax, {
        message: `Message must be ${limits.messageMax} characters or fewer`,
      }),
  });
}

export type CommunityKudosFormValues = z.infer<ReturnType<typeof buildCommunityKudosSchema>>;
