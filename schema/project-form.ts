import { z } from "zod";



const projectLinkSchema = z.object({
    text: z.string({ errorMap: () => ({ message: 'Please provide valid values for project link text/url' }) })
        .trim()
        .min(1),
    url: z.string({ errorMap: () => ({ message: 'Please provide valid values for project link text/url' }) }).url().min(1),
})


export const generalInfoSchema = z.object({
    name: z
        .string({ errorMap: () => ({ message: 'Please provide valid name' }) }).regex(/^[a-zA-Z\s]*$/)
        .trim()
        .min(2)
        .max(64),
    tagline: z
        .string({ errorMap: () => ({ message: 'Please provide valid tag line' }) })
        .trim()
        .min(1),
    description: z
        .string({ errorMap: () => ({ message: 'Please provide valid description' }) })
        .trim()
        .min(1),
    projectLinks: z.array(projectLinkSchema),
    contactEmail: z.union([
        z.string().email({ message: "Invalid email address" }).optional(),
        z.literal("").optional(),
        z.null().optional()
    ]),

});