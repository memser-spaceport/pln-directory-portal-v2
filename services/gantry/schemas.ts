import { z } from 'zod';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const gantryItemFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .refine((value) => stripHtml(value).length > 0, 'Description is required'),
  acceptanceCriteria: z.string().optional().nullable(),
  focusAreaUid: z.string().optional().nullable(),
  externalTrackerUrl: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  type: z.enum(['Bug', 'Improvement', 'Feature Request']).optional().nullable(),
});

export type GantryItemFormValues = z.infer<typeof gantryItemFormSchema>;
