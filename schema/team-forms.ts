import { z } from "zod";

export const basicInfoSchema = z.object({
  requestorEmail: z.string({ errorMap: () => ({ message: 'Please add a valid Requestor email' }) }).email().trim(),
  name: z
    .string({ errorMap: () => ({ message: 'Please add Team Name' }) }).trim()
    .min(1)
    .max(150),
  shortDescription: z
    .string({ errorMap: () => ({ message: 'Please add a Description' }) }).trim()
    .min(1)
    .max(1000),
  longDescription: z
    .string({ errorMap: () => ({ message: 'Please add a Long Description' }) }).trim()
    .min(1)
    .max(2000),
});
