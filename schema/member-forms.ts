import { ZodError, z } from 'zod';
export const basicInfoSchema = z.object({
  name: z
    .string({ errorMap: () => ({ message: 'Please provide valid name' }) })
    .trim()
    .min(2)
    .max(64),
  email: z
    .string({ errorMap: () => ({ message: 'Please provide valid email' }) })
    .trim()
    .email(),
});

const skill = z.object({
  title: z
    .string({ errorMap: () => ({ message: 'Please provide valid skills' }) })
    .trim()
    .min(1),
  uid: z
    .string({ errorMap: () => ({ message: 'Please provide valid skills' }) })
    .trim()
    .min(1),
});

const teamsAndRoles = z.object({
  teamUid: z
    .string({ errorMap: () => ({ message: 'Please provide valid values for team(s)/role(s)' }) })
    .trim()
    .min(1),
  teamTitle: z
    .string({ errorMap: () => ({ message: 'Please provide valid values for team(s)/role(s)' }) })
    .trim()
    .min(1),
  role: z
    .string({ errorMap: () => ({ message: 'Please provide valid values for team(s)/role(s)' }) })
    .trim()
    .min(1),
});

const projectInfo = z.object({
  projectUid: z.string({ errorMap: () => ({ message: 'Please provide valid project name' }) }).min(1),
  role: z.string({ errorMap: () => ({ message: 'Please provide valid role' }) }).min(1),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'Please provide valid project start date' }) }),
  endDate: z.union([z.string({message: 'Please enter valid end date'}).length(0), z.string().datetime({message: "Please enter valid end date"})])
});

export const projectContributionSchema = z.object({
  projectContributions: z.array(projectInfo),
});

export const TeamAndSkillsInfoSchema = z.object({
  teamAndRoles: z.array(teamsAndRoles).nonempty({ message: 'Please provide valid values for team(s)/role(s)' }),
  skills: z.array(skill).nonempty({ message: 'Please provide valid skills' }),
});