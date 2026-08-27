import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import { seniorityDisplayLabel, workplaceTypeDisplayLabel } from '@/utils/jobs.utils';

/**
 * The job description the board never had.
 *
 * **Production carries none of this.** `IJobRole` is title, category, seniority,
 * location, work mode and an `applyUrl` — the board's rows are scraped listing
 * headers, and the description has always lived behind that outbound link. So
 * everything below is invented, and the prototype argues a shape rather than
 * reporting one: if in-app job detail ships, the ingest has to start carrying a
 * body, or this drawer has nothing to render.
 *
 * The content is generated per role rather than hand-written thirteen times.
 * Each category has one template, the role title and the team's name are
 * interpolated into it, and four roles carry a hand-written override where the
 * generic version read as filler. That is enough to judge the *layout* — how
 * much scroll a description costs, where Apply has to sit to stay reachable —
 * which is the only thing mock prose can honestly be used for.
 */
export interface JobDetail {
  /** The lede. Two short paragraphs; a wall of text is a different prototype. */
  summary: string[];
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  /** The two facts a listing row cannot carry and everyone scrolls for. */
  compensation: string;
  process: string;
}

type CategoryTemplate = (role: IJobRole, team: IJobTeam) => JobDetail;

const PAY = 'Competitive salary benchmarked to your location, plus a token grant. Bands are shared on the first call.';

const ENGINEERING: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to work on the systems the network runs on. You will own real surface area from your first month — the team is small, the code is public, and the people using what you ship are reachable in the same forums you are.`,
    'This is a build role, not a coordination one. Expect to spend most of your week in the codebase, with design work happening in the open through proposals and RFCs rather than in a planning tool.',
  ],
  responsibilities: [
    'Design, build and maintain production services that other teams in the network depend on.',
    'Write and review public specifications for the interfaces you own.',
    'Take part in on-call for the components you ship, with the tooling to make that humane.',
    'Work with the open-source community that files issues against your code.',
  ],
  requirements: [
    'Several years building and operating distributed or networked systems in production.',
    'Comfort working in a public repository, where design discussions and mistakes are both visible.',
    'Strong written communication — this team is distributed across eight time zones and decisions are made in writing.',
  ],
  niceToHave: [
    'Experience with peer-to-peer protocols, content addressing or decentralised storage.',
    'Prior open-source maintainership.',
  ],
  compensation: PAY,
  process:
    'Intro call, a technical conversation about something you have built, a paid work sample, and a team round. Usually three weeks end to end.',
});

const PRODUCT: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is looking for a ${role.roleTitle} to own a product area end to end — from the problem statement through to what ships and what gets measured afterwards.`,
    'The users here are largely builders, so the research loop is short and direct: you will be talking to the people who integrate this every week rather than reading about them in a report.',
  ],
  responsibilities: [
    'Own the roadmap for your area and the reasoning behind it, in public.',
    'Turn open-ended network problems into scoped, shippable work.',
    'Run the discovery loop — interviews, telemetry, forum threads — and bring the evidence back to the team.',
    'Write the release notes and the deprecation notices, and stand behind both.',
  ],
  requirements: [
    'Experience shipping developer or infrastructure products, not only consumer surfaces.',
    'Enough technical depth to argue with engineers about trade-offs rather than relay them.',
    'A track record of saying no to work, in writing, with reasons.',
  ],
  niceToHave: [
    'Prior work in open-source ecosystems or standards bodies.',
    'You have shipped an API someone else depends on.',
  ],
  compensation: PAY,
  process: 'Intro call, a product deep dive on something you shipped, a written exercise, and a team round.',
});

const RESEARCH: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to work on open problems whose answers become protocol. Output here is public — papers, specifications and reference implementations — and it is expected to survive contact with production.`,
    'You will work alongside the engineering teams implementing what you propose, which means research questions arrive with real constraints attached.',
  ],
  responsibilities: [
    'Investigate open problems in protocol design and publish the results.',
    'Turn findings into specifications engineering teams can build from.',
    'Review proposals from the wider research community.',
    'Represent the work at workshops and in standards discussions.',
  ],
  requirements: [
    'A record of published work in distributed systems, cryptography or a neighbouring field.',
    'Ability to write for two audiences at once: reviewers and implementers.',
    'Comfort working without a fixed deadline, and reporting honestly when a direction fails.',
  ],
  niceToHave: ['Experience taking a research result all the way into a shipped system.'],
  compensation: PAY,
  process: 'Intro call, a discussion of your published work, a research talk to the team, and a final round.',
});

const DESIGN: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to shape how people encounter the network — the flows, the surfaces and the language that make an unfamiliar system legible.`,
    'You will be the design partner to two engineering teams rather than a request queue: what to build is as much your question as how it looks.',
  ],
  responsibilities: [
    'Own the end-to-end design of flows across the product, from first sketch to shipped detail.',
    'Extend the design system, and say when something should not become a component.',
    'Run lightweight research with builders in the network and bring findings back with a recommendation.',
    'Work in the open — design decisions get written down and argued about here.',
  ],
  requirements: [
    'A portfolio of shipped product work where you can explain what you cut and why.',
    'Fluency in a component-driven design system, and in the code vocabulary it maps to.',
    'Comfort designing for technical users without falling back on jargon.',
  ],
  niceToHave: ['Experience designing developer tools, dashboards or data-dense interfaces.'],
  compensation: PAY,
  process: 'Intro call, a portfolio walkthrough, a paid design exercise, and a team round.',
});

const GROWTH: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to grow the set of teams building on the network — finding them, supporting them, and making the case internally for what they need.`,
    'This is a relationship role with a technical floor: you will be talking to founders and engineering leads, and you have to be credible in both conversations.',
  ],
  responsibilities: [
    'Own a portfolio of ecosystem relationships from first contact through to what they ship.',
    'Bring what those teams need back to product and engineering with evidence attached.',
    'Represent the network at events and in the places builders already gather.',
    'Report honestly on which partnerships are working and which should end.',
  ],
  requirements: [
    'Experience growing a developer ecosystem, a partner programme or a technical community.',
    'Enough technical fluency to hold a conversation about integration without a translator.',
    'Willingness to travel a few times a quarter.',
  ],
  niceToHave: ['An existing network in open-source infrastructure or Web3.'],
  compensation: PAY,
  process:
    'Intro call, a conversation about a relationship you grew, a written plan for a first ninety days, and a team round.',
});

const OPERATIONS: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to run the machinery behind a programme that moves real money to real teams — intake, review, disbursement and everything that goes wrong in between.`,
    'Most of the value here is in making a slow, opaque process fast and legible, for applicants as much as for the people reviewing them.',
  ],
  responsibilities: [
    'Run the operating cadence of the programme end to end.',
    'Keep applicants informed at every stage, including the rejections.',
    'Build the reporting the team and its funders actually read.',
    'Find the steps that exist only because they always have, and remove them.',
  ],
  requirements: [
    'Experience running a grants, accelerator or similar programme at volume.',
    'Strong written communication — most of this job is other people reading what you wrote.',
    'Comfort with ambiguity, and with saying no kindly and clearly.',
  ],
  niceToHave: ['Familiarity with open-source funding models or public-goods funding.'],
  compensation: PAY,
  process: 'Intro call, a process walkthrough, a short written exercise, and a team round.',
});

const MARKETING: CategoryTemplate = (role, team) => ({
  summary: [
    `${team.name} is hiring a ${role.roleTitle} to help developers get from having heard of this to a working integration — through documentation, talks, sample code and the occasional very direct answer in a forum thread.`,
    'The bar here is technical: you will be writing code that other people copy, so it has to be code you would defend.',
  ],
  responsibilities: [
    'Write and maintain the guides, tutorials and sample applications developers start from.',
    'Speak at conferences and run workshops.',
    'Be present where developers ask questions, and route the recurring ones back into the product.',
    'Own the developer-facing narrative for launches.',
  ],
  requirements: [
    'Demonstrable ability to write both code and prose that other people rely on.',
    'Experience presenting technical material to an audience that can tell when you are bluffing.',
    'Enough engineering background to build the sample app yourself.',
  ],
  niceToHave: ['An existing body of public technical writing or talks.'],
  compensation: PAY,
  process: 'Intro call, a review of something you wrote or presented, a short content exercise, and a team round.',
});

const BY_CATEGORY: Record<string, CategoryTemplate> = {
  Engineering: ENGINEERING,
  Product: PRODUCT,
  Research: RESEARCH,
  Design: DESIGN,
  'Business Development': GROWTH,
  Operations: OPERATIONS,
  Marketing: MARKETING,
};

/** Roles where the generic template read as filler, written out instead. */
const OVERRIDES: Record<string, Partial<JobDetail>> = {
  'pl-1': {
    summary: [
      'Protocol Labs is hiring a Senior Distributed Systems Engineer to work on the storage and retrieval layer the rest of the network builds on. You will own a service other teams depend on, in a repository anyone can read.',
      'The problems are the honest kind: partial failure, backpressure, and what a system should do when half of it disagrees with the other half. Most of the design work happens in public proposals before any code is written.',
    ],
    niceToHave: [
      'Experience with content-addressed storage, IPLD or libp2p.',
      'You have operated something at a scale where the interesting failures only appear in production.',
    ],
  },
  'pl-4': {
    summary: [
      'Protocol Labs is hiring a Staff Security Engineer to be the person the network calls when something looks wrong — and, more of the time, the person whose work means nobody has to call.',
      'You will set the security posture across several independent teams, which makes the job as much persuasion and tooling as it is review.',
    ],
    responsibilities: [
      'Lead threat modelling for protocol changes before they ship.',
      'Run the disclosure process, including the parts that involve talking to strangers under time pressure.',
      'Build the tooling and defaults that make the secure path the easy one.',
      'Mentor engineers across teams on secure design.',
    ],
  },
  'ipfs-1': {
    summary: [
      'IPFS Collective is hiring a Product Designer to make a genuinely unfamiliar system feel obvious. Content addressing is a good idea most people meet through a bad interface; changing that is the job.',
      'You will be the only designer on two engineering teams, which means high autonomy and a real obligation to write your reasoning down.',
    ],
  },
  'bac-1': {
    summary: [
      'Bacalhau is hiring a Founding Backend Engineer. There are eleven people here and no separate platform team, so the scope is wide by default: you will design the service, run it, and be the one paged when it misbehaves.',
      'Founding is meant literally — the conventions you set in the first six months are the ones the next ten engineers inherit.',
    ],
    compensation:
      'Competitive salary plus meaningful early equity and a token grant. Bands are shared on the first call.',
  },
};

/**
 * The description for one role. Deterministic — same role in, same body out —
 * so nothing shifts under a reader who closes the drawer and opens it again.
 */
export function getJobDetail(role: IJobRole, team: IJobTeam): JobDetail {
  const template = BY_CATEGORY[role.roleCategory ?? ''] ?? ENGINEERING;
  return { ...template(role, team), ...(OVERRIDES[role.uid] ?? {}) };
}

/**
 * The facts under the title: seniority, category, where, and how. The same parts
 * the row shows, plus work mode — a row has no space for it, and a description
 * is exactly where "is this actually remote" gets answered.
 */
export function jobMetaParts(role: IJobRole): string[] {
  return [
    role.seniority ? seniorityDisplayLabel(role.seniority) : null,
    role.roleCategory,
    role.location.length ? role.location.join(', ') : null,
    role.workMode ? workplaceTypeDisplayLabel(role.workMode) : null,
  ].filter(Boolean) as string[];
}
