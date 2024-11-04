import { z } from 'zod';

export const basicInfoSchema = z.object({
  requestorEmail: z
    .string({ errorMap: () => ({ message: 'Please add a valid Requestor email' }) })
    .email()
    .trim(),
  name: z
    .string({ errorMap: () => ({ message: 'Please add Team Name' }) })
    .trim()
    .min(1)
    .max(150),
  shortDescription: z
    .string({ errorMap: () => ({ message: 'Please add a Description' }) })
    .trim()
    .min(1)
    .max(1000),
  longDescription: z
    .string({ errorMap: () => ({ message: 'Please add a Long Description' }) })
    .trim()
    .min(1)
});

const industryTag = z.object({
  title: z.string(),
  uid: z.string(),
});

const fundingStage = z.object({
  title: z.string(),
  uid: z.string(),
});

export const projectDetailsSchema = z.object({
  fundingStage: fundingStage.refine((obj) => obj.title && obj.uid, {
    message: 'Please add Funding Stage',
  }),
  industryTags: z.array(industryTag).nonempty({ message: 'Please add Industry Tags' })
});

export const socialSchema = z.object({
  contactMethod: z
    .string({ errorMap: () => ({ message: 'Please add Preferred method of contact' }) })
    .trim()
    .min(1)
    .max(200),
  website: z
    .string({ errorMap: () => ({ message: 'Please add website' }) })
    .trim()
    .min(1)
    .max(1000),
});
