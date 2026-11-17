import type { IJobRole, IJobTeam } from '@/types/jobs.types';

import { MOCK_JOB_GROUPS } from '../job-board/mocks';

/*
 * LAB-3272 mocks. No real member data: the member below is invented.
 * The roles come from the job board prototype's own mocks, so the page reads the same posting the board opens.
 */

/** How the role takes applications. `labos`: sent in LabOS. `external`: only on the team's own site. */
export type ApplyRoute = 'labos' | 'external';

export type ApplyRole = { role: IJobRole; team: IJobTeam; route: ApplyRoute };

function pick(roleUid: string, route: ApplyRoute): ApplyRole {
  for (const g of MOCK_JOB_GROUPS) {
    const role = g.roles.find((r) => r.uid === roleUid);
    if (role) return { role, team: g.team, route };
  }
  throw new Error(`No mock role ${roleUid}`);
}

export const APPLY_ROLES: Record<ApplyRoute, ApplyRole> = {
  labos: pick('pl-1', 'labos'),
  external: pick('lp-1', 'external'),
};

/** The job aspirant. Invented, with gaps the post asks about: no resume, no GitHub link. */
export const MOCK_MEMBER = {
  name: 'Sam Rivera',
  firstName: 'Sam',
  email: 'sam.rivera@example.com',
  role: 'Backend Engineer',
  location: 'Lisbon, Portugal',
  skills: ['Go', 'Rust', 'Distributed systems'],
  experience: 'Backend Engineer, Ferrow Data · 2022 to now',
};

export const MOCK_RESUME_FILE = 'sam-rivera-resume.pdf';

/** What the profile does not have and the post asks for. */
export const PROFILE_GAPS = [
  { field: 'Resume', why: 'The post asks for one' },
  { field: 'GitHub', why: 'The post asks for public code' },
];

/** What the agent reads in the resume, as profile changes (old → new). */
export const RESUME_CHANGES = [
  { field: 'Resume', from: 'Not added', to: MOCK_RESUME_FILE },
  { field: 'GitHub', from: 'Not added', to: 'github.com/sam-rivera-dev' },
  { field: 'Experience', from: '1 role', to: 'Adds Software Engineer, Northwind Labs · 2019 to 2022' },
];

/** The first draft. Short paragraphs, written from the post and the profile. */
export function firstDraft(a: ApplyRole): string {
  return [
    `Hi ${a.team.name} team,`,
    `I'm applying for the ${a.role.roleTitle} role. I'm a backend engineer at Ferrow Data, where I build and run Go services that move data between regions for 40 customer teams.`,
    `Your post asks for production experience with distributed systems and for written design work. I own our replication service end to end, and I write the design docs for it in public.`,
    `I would like to bring that to ${a.team.name}. My profile has the details, and I'm happy to talk this week.`,
    `Sam Rivera`,
  ].join('\n\n');
}

/** The draft after "Make it shorter and mention my Rust work". */
export function shorterDraft(a: ApplyRole): string {
  return [
    `Hi ${a.team.name} team,`,
    `I'm applying for the ${a.role.roleTitle} role. At Ferrow Data I own a Go replication service that runs across three regions.`,
    `I also maintain a small open-source Rust library for content-addressed storage, which matches the work in your post.`,
    `I'm happy to talk this week.`,
    `Sam Rivera`,
  ].join('\n\n');
}

/** The draft after the resume filled the gaps: it can now name the earlier role and the code. */
export function gapFilledDraft(a: ApplyRole): string {
  return [
    `Hi ${a.team.name} team,`,
    `I'm applying for the ${a.role.roleTitle} role. At Ferrow Data I own a Go replication service that runs across three regions. Before that, I built peer-to-peer sync at Northwind Labs.`,
    `My code is public at github.com/sam-rivera-dev, including a Rust library for content-addressed storage.`,
    `I'm happy to talk this week.`,
    `Sam Rivera`,
  ].join('\n\n');
}
