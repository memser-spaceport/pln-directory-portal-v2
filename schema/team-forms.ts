import { z } from 'zod';

const validFormats = ['image/jpeg', 'image/png'];

const decodeBase64 = (base64: any) => {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binaryString = atob(data);
  const size = binaryString.length;
  return { mime, size };
};

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
    .max(2000),
  profileimage: z
    .string()
    .refine(
      (base64) => {
        const { mime } = decodeBase64(base64);
        console.log(mime, 'miem');
        return validFormats.includes(mime);
      },
      {
        message: 'Invalid file format. Only JPEG and PNG are allowed.',
      }
    )
    .refine(
      (base64) => {
        const { size } = decodeBase64(base64);
        return size / 1024 ** 2 < 4; // size in MB
      },
      {
        message: 'Please upload a file less than 4MB',
      }
    )
    .optional(),
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
  industryTags: z.array(industryTag).nonempty({ message: 'Please add Industry Tags' }),
  fundingStage: fundingStage.refine((obj) => obj.title && obj.uid, {
    message: 'Please add Funding Stage',
  }),
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
