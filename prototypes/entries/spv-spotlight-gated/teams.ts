import type { ITeam, IFormatedTeamProject } from '@/types/teams.types';
import type { IMember } from '@/types/members.types';
import type { IFocusArea } from '@/types/shared.types';
import type { ITeamFocusAres } from '@/components/page/team-details/TeamFocusAreas/types';
import { MOCK_TEAM, MOCK_MEMBERS, MOCK_PROJECTS, MOCK_NEWS } from '../team-profile/mocks';
import type { EventRoleGroup } from '../demoday-tag-placements/mocks';
import type { NewsItemWithPost } from '../news-shared/teamPosts';

// The teams in the SPV, each carrying everything the dev team page shows
// (/teams/[id]): details + about, contact, membership source, community
// affiliations, contributions, members, focus areas, projects and news.
// Every record is the team-profile prototype's MOCK_TEAM shape with the
// identity swapped, so the sections render through the same mocked views that
// prototype uses — plus one DocSend link per team.
//
// Lengths and taxonomy follow real directory teams: one-liners run 100–200
// characters (the teams list clamps them at three lines), About is a few
// paragraphs, a team has 4–7 industry tags, and stages use the directory's
// own names (Pre-seed / Seed / Series A / Series B).

export type SpvTeam = {
  uid: string;
  name: string;
  logoUrl: string;
  shortDescription: string;
  docSendUrl: string;
  team: ITeam;
  members: IMember[];
  projects: IFormatedTeamProject[];
  contributions: EventRoleGroup[];
  news: NewsItemWithPost[];
  teamFocusAreas: ITeamFocusAres[];
  // The team's main focus area (the network's own practice areas). The card
  // gives it the lead, iconed chip — the slot the teams list gives Priority.
  leadFocusArea: string;
  // The rest of the card's tags: other focus areas, then industry tags.
  cardTags: { title: string }[];
};

// The directory's five top-level focus areas, in utils/sortFocusAreas order.
// The top level is real; the sub-areas under each are placeholders until the
// live tree can be read (the dev API was down when this was built).
export const SPV_FOCUS_AREAS: IFocusArea[] = [
  {
    uid: 'fa-dhr',
    title: 'Digital Human Rights',
    children: [
      { uid: 'fa-dhr-privacy', title: 'Privacy & Encryption' },
      { uid: 'fa-dhr-identity', title: 'Self-Sovereign Identity' },
      { uid: 'fa-dhr-info', title: 'Access to Information' },
    ],
  },
  {
    uid: 'fa-econ',
    title: 'Economies & Governance',
    children: [
      { uid: 'fa-econ-defi', title: 'Onchain Finance' },
      { uid: 'fa-econ-dao', title: 'DAO Tooling' },
      { uid: 'fa-econ-desci', title: 'Science Funding' },
    ],
  },
  {
    uid: 'fa-ai',
    title: 'AI & Robotics',
    children: [
      { uid: 'fa-ai-data', title: 'Training Data' },
      { uid: 'fa-ai-safety', title: 'Evaluation & Safety' },
      { uid: 'fa-ai-robotics', title: 'Embodied AI' },
      { uid: 'fa-ai-compute', title: 'Verifiable Compute' },
    ],
  },
  {
    uid: 'fa-neuro',
    title: 'Neurotech',
    children: [
      { uid: 'fa-neuro-bci', title: 'Brain–Computer Interfaces' },
      { uid: 'fa-neuro-monitoring', title: 'Neural Monitoring' },
    ],
  },
  {
    uid: 'fa-bin',
    title: 'Build Innovation Network',
    children: [
      { uid: 'fa-bin-storage', title: 'Decentralized Storage' },
      { uid: 'fa-bin-networking', title: 'Peer-to-Peer Networking' },
      { uid: 'fa-bin-devtools', title: 'Developer Tools' },
    ],
  },
] as unknown as IFocusArea[];

const SUB_AREAS = new Map(
  SPV_FOCUS_AREAS.flatMap((g) =>
    (g.children as unknown as ITeamFocusAres[]).map((c) => [c.uid, { ...c, group: g.title }] as const),
  ),
);

type Seed = {
  uid: string;
  name: string;
  shortDescription: string;
  about: string[];
  stage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B';
  // Internal PL ranking. Kept on the record because real teams have it, but
  // never rendered here: production shows it only to tier viewers
  // (team.priority.read), and SPV investors are outside that.
  priority: 1 | 2 | 3 | 4;
  industryTags: string[];
  focusAreas: string[]; // sub-area uids from SPV_FOCUS_AREAS
  membershipSources: string[];
  communityAffiliations: string[];
  domain: string;
  founders: [string, string];
  project: [string, string];
  news: [string, string];
};

const SEEDS: Seed[] = [
  {
    uid: 't-1',
    name: 'Lumen Labs',
    shortDescription:
      'Lumen Labs runs scientific workloads on a verifiable compute layer, so every result ships with a cryptographic record of the code, data and hardware that produced it.',
    about: [
      'Reproducibility is the quiet crisis of computational science: most published results cannot be re-run, and reviewers rarely try. Lumen Labs makes every pipeline run produce a signed, content-addressed record of exactly what executed — container, inputs, parameters and hardware — that anyone can check without re-running the job.',
      'Twelve research groups run production pipelines on Lumen today, across genomics, climate modelling and materials science. Records are stored on decentralized storage, so a lab’s history outlives any single vendor, including Lumen.',
      'The seed extension funds a hosted tier for university labs and a second compute region in Europe.',
    ],
    stage: 'Seed',
    priority: 1,
    industryTags: ['DeSci', 'Compute', 'Infrastructure', 'Research', 'Open Source'],
    focusAreas: ['fa-ai-compute', 'fa-econ-desci', 'fa-bin-storage'],
    membershipSources: ['Protocol Labs', 'PL Venture Studio'],
    communityAffiliations: ['DeSci Community', 'IPFS'],
    domain: 'lumenlabs.example',
    founders: ['Ada Okafor', 'Tomás Reyes'],
    project: ['Lumen Runtime', 'Deterministic execution and proof export for research pipelines.'],
    news: ['Lumen Labs opens its hosted tier to university labs', 'Lumen Runtime 1.0 ships with proof export'],
  },
  {
    uid: 't-2',
    name: 'Harbor Keys',
    shortDescription:
      'Harbor Keys gives teams shared custody of onchain treasuries — spending policies, multi-party approvals and a full audit trail — without handing keys to a custodian.',
    about: [
      'Most organisations holding crypto choose between a custodian they have to trust and a multisig nobody can administer. Harbor Keys sits between the two: keys are split across the team’s own devices, and every transaction is checked against policies the treasury sets — limits, allow-lists, time locks and approval quorums.',
      'More than 400 DAOs, funds and companies run treasuries on Harbor Keys, securing just over $2B in assets. The product has passed two external security audits and a formal verification of its policy engine.',
      'The Series A extension funds institutional reporting and support for three further chains.',
    ],
    stage: 'Series A',
    priority: 1,
    industryTags: ['Crypto', 'Security', 'Wallets', 'Infrastructure', 'Enterprise', 'DAOs'],
    focusAreas: ['fa-econ-dao', 'fa-econ-defi', 'fa-dhr-privacy'],
    membershipSources: ['Protocol Labs'],
    communityAffiliations: ['Ethereum', 'Filecoin'],
    domain: 'harborkeys.example',
    founders: ['Priya Nair', 'Jonas Weber'],
    project: ['Harbor Policy', 'Programmable spending rules and approval quorums for shared wallets.'],
    news: ['Harbor Keys passes its second external security audit', 'Harbor Policy adds time-locked approvals'],
  },
  {
    uid: 't-3',
    name: 'Tessellate',
    shortDescription:
      'Tessellate collects and labels real-world manipulation data for robotics teams and licenses it per training run, so labs pay for the data they actually use.',
    about: [
      'Robot learning is bottlenecked on data, not models. Tessellate operates collection cells in three warehouses and two home environments, recording grasping, sorting and assembly tasks with synchronized video, depth, force and joint-state streams.',
      'Datasets are licensed per training run through an onchain registry, which lets contributors — including the operators who teleoperate the cells — earn from every use of the data they helped create.',
    ],
    stage: 'Pre-seed',
    priority: 2,
    industryTags: ['Robotics', 'AI', 'Data', 'Marketplaces'],
    focusAreas: ['fa-ai-robotics', 'fa-ai-data'],
    membershipSources: ['PL Venture Studio'],
    communityAffiliations: [],
    domain: 'tessellate.example',
    founders: ['Mei Lin', 'Oscar Duarte'],
    project: ['Tessellate Hub', 'Browse, sample and license manipulation datasets by the training run.'],
    news: ['Tessellate releases 40k hours of warehouse grasping data', 'Tessellate signs its first humanoid lab'],
  },
  {
    uid: 't-4',
    name: 'Quiet Signal',
    shortDescription:
      'Quiet Signal builds speech models that run entirely on the clinician’s device, turning consultations into structured notes without patient audio ever leaving the room.',
    about: [
      'Clinicians spend close to two hours on documentation for every hour with patients. Cloud scribes help, but many hospitals cannot send patient audio to a third party. Quiet Signal’s models transcribe and draft notes on a standard tablet, fully offline.',
      'The company is piloting with three outpatient networks and has completed an independent privacy review. Notes export directly into the two most common electronic health record systems.',
      'The seed round funds regulatory work and a specialty model for mental-health practice.',
    ],
    stage: 'Seed',
    priority: 2,
    industryTags: ['AI', 'Health', 'Privacy', 'Healthcare IT', 'Speech'],
    focusAreas: ['fa-dhr-privacy', 'fa-ai-safety'],
    membershipSources: ['Protocol Labs'],
    communityAffiliations: [],
    domain: 'quietsignal.example',
    founders: ['Hana Sato', 'Daniel Brooks'],
    project: ['Quiet Scribe', 'Offline transcription and note drafting for outpatient clinics.'],
    news: ['Quiet Signal pilots with three outpatient networks', 'Quiet Scribe now runs on standard tablets'],
  },
  {
    uid: 't-5',
    name: 'Fieldnote',
    shortDescription:
      'Fieldnote is an electronic lab notebook where every entry is timestamped and signed, giving research labs a record that holds up in peer review, audits and patent filings.',
    about: [
      'Lab notebooks are still the legal and scientific record of research, and most of them are paper or unsigned PDFs. Fieldnote records every entry, image and instrument export with a signature and an anchored timestamp, so a lab can prove what it knew and when.',
      'Fieldnote integrates with two major lab information management systems and is used by 60 labs across academia and early-stage biotech.',
    ],
    stage: 'Seed',
    priority: 3,
    industryTags: ['DeSci', 'Tooling', 'Biotech', 'SaaS'],
    focusAreas: ['fa-econ-desci', 'fa-dhr-info'],
    membershipSources: ['Protocol Labs'],
    communityAffiliations: ['DeSci Community'],
    domain: 'fieldnote.example',
    founders: ['Ruth Adeyemi', 'Sven Holm'],
    project: ['Fieldnote ELN', 'Signed, timestamped lab records with instrument integrations.'],
    news: ['Fieldnote integrates with two major LIMS vendors', 'Fieldnote adds signed image capture'],
  },
  {
    uid: 't-6',
    name: 'Orbit Relay',
    shortDescription:
      'Orbit Relay runs a retrieval layer in front of decentralized storage networks, caching hot content at the edge so applications see CDN-level latency on content-addressed data.',
    about: [
      'Decentralized storage is cheap and durable, but retrieval has been its weak spot: first-byte times in seconds rule out most consumer apps. Orbit Relay operates edge nodes in 40 cities that cache and serve content-addressed data, with retrieval paid per gigabyte.',
      'Orbit Relay serves more than 2 PB a month for NFT platforms, video apps and research archives, and launched its APAC region this summer.',
      'The Series B funds a self-serve tier and a partnership programme for independent node operators.',
    ],
    stage: 'Series B',
    priority: 1,
    industryTags: ['Infrastructure', 'Storage', 'Networking', 'CDN', 'Web3', 'Filecoin'],
    focusAreas: ['fa-bin-storage', 'fa-bin-networking'],
    membershipSources: ['Protocol Labs', 'Filecoin Foundation'],
    communityAffiliations: ['Filecoin', 'IPFS', 'libp2p'],
    domain: 'orbitrelay.example',
    founders: ['Luca Romano', 'Aisha Khan'],
    project: ['Orbit Edge', 'Edge caching and paid retrieval for content-addressed data.'],
    news: ['Orbit Relay crosses 2 PB served per month', 'Orbit Edge launches in APAC'],
  },
  {
    uid: 't-7',
    name: 'Canopy Bio',
    shortDescription:
      'Canopy Bio makes a soft EEG headband for months-long neural monitoring at home, and the data platform research teams use to run remote studies on it.',
    about: [
      'Most neurological data is collected in a clinic for an hour at a time, which misses the events researchers care about. Canopy Band is a soft, dry-electrode EEG headband comfortable enough to sleep in, paired with a platform that handles consent, device logistics and data review.',
      'Canopy Bio has research-use clearance and is running a 200-patient sleep study with two academic medical centres.',
    ],
    stage: 'Seed',
    priority: 2,
    industryTags: ['Neurotech', 'Hardware', 'Health', 'Medical Devices', 'Research'],
    focusAreas: ['fa-neuro-monitoring', 'fa-neuro-bci'],
    membershipSources: ['PL Venture Studio'],
    communityAffiliations: ['Neurotech Community'],
    domain: 'canopybio.example',
    founders: ['Elena Petrova', 'Marcus Hill'],
    project: ['Canopy Band', 'Soft dry-electrode EEG for at-home studies.'],
    news: ['Canopy Bio starts a 200-patient sleep study', 'Canopy Band receives research-use clearance'],
  },
  {
    uid: 't-8',
    name: 'Ledgerline',
    shortDescription:
      'Ledgerline turns onchain treasury activity into books an auditor accepts — categorised transactions, cost basis across chains and period-end reports for DAOs and funds.',
    about: [
      'Organisations that hold assets onchain still close their books in spreadsheets. Ledgerline reads activity across chains and exchanges, categorises it with rules the finance team controls, and produces the reports auditors and tax advisors ask for.',
      'Ledgerline closed the books for 150 DAOs and funds last quarter and is used by two of the top ten crypto accounting firms.',
    ],
    stage: 'Seed',
    priority: 3,
    industryTags: ['Crypto', 'Fintech', 'Compliance', 'Accounting', 'DAOs'],
    focusAreas: ['fa-econ-defi', 'fa-econ-dao'],
    membershipSources: ['Protocol Labs'],
    communityAffiliations: ['Ethereum'],
    domain: 'ledgerline.example',
    founders: ['Grace Obi', 'Tom Fischer'],
    project: ['Ledgerline Close', 'Period-end reporting and cost basis for DAOs and funds.'],
    news: ['Ledgerline closes books for 150 DAOs this quarter', 'Ledgerline adds multi-chain cost basis'],
  },
  {
    uid: 't-9',
    name: 'Mosaic AI',
    shortDescription:
      'Mosaic AI runs evaluation agents against every model release a team ships, catching regressions in accuracy, safety and cost before they reach users.',
    about: [
      'Model teams ship weekly, and their evaluation suites rarely keep up. Mosaic AI’s agents generate and run targeted test cases against each release, compare the results with the previous version and flag regressions with examples a reviewer can act on.',
      'The evaluation harness is open source; the hosted product adds scheduling, history and team review. Eleven AI companies run Mosaic on every release.',
    ],
    stage: 'Pre-seed',
    priority: 4,
    industryTags: ['AI', 'Developer Tools', 'Open Source', 'MLOps'],
    focusAreas: ['fa-ai-safety', 'fa-bin-devtools'],
    membershipSources: ['PL Venture Studio'],
    communityAffiliations: [],
    domain: 'mosaicai.example',
    founders: ['Noah Park', 'Leila Haddad'],
    project: ['Mosaic Evals', 'Open-source regression suites that run on every model release.'],
    news: ['Mosaic AI open-sources its eval harness', 'Mosaic Evals adds multimodal test suites'],
  },
];

// Host / Sponsor only — the two roles the copied production view has icons for.
const CONTRIBUTION_POOL: EventRoleGroup[] = [
  {
    icon: 'host_icon',
    role: 'Host',
    events: [
      { uid: 'e1', name: 'DeSci Summit', date: 'Jun 2026' },
      { uid: 'e2', name: 'LabWeek', date: 'Oct 2025' },
    ],
  },
  {
    icon: 'sponsor_icon',
    role: 'Sponsor',
    events: [
      { uid: 'e3', name: 'FIL Dev Summit', date: 'Nov 2025' },
      { uid: 'e4', name: 'ETHDenver', date: 'Feb 2026' },
    ],
  },
];

// A real news record from the team-profile mocks, re-labelled per team.
const NEWS_BASE = MOCK_NEWS.find((n) => n.uid === 'news-1') ?? MOCK_NEWS[0];

const tagList = (uid: string, key: string, titles: string[]) =>
  titles.map((title, k) => ({ uid: `${uid}-${key}-${k}`, title }));

const build = (seed: Seed, i: number): SpvTeam => {
  const handle = seed.name.replace(/\s+/g, '').toLowerCase();
  const team = {
    ...MOCK_TEAM,
    id: seed.uid,
    name: seed.name,
    shortDescription: seed.shortDescription,
    longDescription: seed.about.map((p) => `<p>${p}</p>`).join(''),
    website: `https://${seed.domain}`,
    twitter: `https://twitter.com/${handle}`,
    linkedinHandle: `https://www.linkedin.com/company/${seed.name.replace(/\s+/g, '-').toLowerCase()}`,
    telegramHandler: '',
    blog: '',
    contactMethod: `hello@${seed.domain}`,
    fundingStage: { title: seed.stage },
    priority: seed.priority,
    isFund: false,
    industryTags: tagList(seed.uid, 'tag', seed.industryTags),
    membershipSources: tagList(seed.uid, 'ms', seed.membershipSources),
    communityAffiliations: tagList(seed.uid, 'ca', seed.communityAffiliations),
  } as unknown as ITeam;

  const teamFocusAreas = seed.focusAreas.map((uid) => {
    const sub = SUB_AREAS.get(uid);
    return { uid, title: sub?.title ?? uid };
  });
  const focusGroups = Array.from(new Set(seed.focusAreas.map((uid) => SUB_AREAS.get(uid)?.group ?? '')));

  const members = seed.founders.map((name, k) => ({
    ...MOCK_MEMBERS[k],
    id: `${seed.uid}-mem-${k}`,
    name,
    teamLead: k === 0,
    teams: [{ id: seed.uid, name: seed.name, role: k === 0 ? 'Co-founder & CEO' : 'Co-founder & CTO' }],
  })) as unknown as IMember[];

  const projects = [
    {
      ...MOCK_PROJECTS[0],
      uid: `${seed.uid}-proj`,
      name: seed.project[0],
      tagline: seed.project[1],
      logo: undefined,
    },
  ] as unknown as IFormatedTeamProject[];

  const news = seed.news.map((title, k) => ({
    ...NEWS_BASE,
    uid: `${seed.uid}-news-${k}`,
    teamUid: seed.uid,
    teamName: seed.name,
    title,
    summary: seed.about[0],
    eventType: k === 0 ? 'ANNOUNCEMENT' : 'PRODUCT',
    eventDate: k === 0 ? '2026-09-10T10:00:00.000Z' : '2026-07-22T10:00:00.000Z',
    createdAt: k === 0 ? '2026-09-10T10:00:00.000Z' : '2026-07-22T10:00:00.000Z',
    tags: [],
    focusAreas: focusGroups,
  })) as unknown as NewsItemWithPost[];

  return {
    uid: seed.uid,
    name: seed.name,
    logoUrl: '',
    shortDescription: seed.shortDescription,
    docSendUrl: `https://docsend.com/view/${seed.uid}`,
    team,
    members,
    projects,
    // Rotate so teams don't all share the same history; some have none.
    contributions: i % 3 === 2 ? [] : i % 3 === 1 ? CONTRIBUTION_POOL.slice(0, 1) : CONTRIBUTION_POOL,
    news,
    teamFocusAreas,
    leadFocusArea: focusGroups[0],
    // Deduped: a focus area and an industry tag can share a name (Neurotech),
    // and TeamsTagsList keys its chips by title.
    cardTags: Array.from(new Set([...focusGroups.slice(1), ...seed.industryTags]))
      .filter((title) => title !== focusGroups[0])
      .map((title) => ({ title })),
  };
};

export const spvTeams: SpvTeam[] = SEEDS.map(build);
