import type { CannedAnswer, CorpusItem, DirectoryHit } from '../ai-search/mocks';
import { hit, pick, tokenize } from '../ai-search/mocks';
import type { AiSearchScope } from '../ai-search/scope';

/**
 * The member profile's scope for the AI Search dialog: what "Ask AI about
 * <name>" can read, which questions it offers, and where each answer's door
 * lands on this page.
 *
 * The team profile's scope (`team-profile/aiSearchScope.ts`) is the model:
 * one prompt per section the page renders, answers computed from the same
 * fixtures the sections draw, so an answer and the section its door opens
 * always agree. A person's page has fewer sections a stranger may read, and
 * all of them are public, so nothing here carries a lock pill.
 *
 * The prompts read the page's own cards: Office Hours (what she offers to
 * help with), Experience, Project Contributions, Repositories. The overview
 * leads, as it does for a team.
 */

export interface MemberScopeInput {
  member: {
    id: string;
    name: string;
    profile: string;
    role: string;
    locationLabel: string;
    bio: string;
    skills: { title: string }[];
    teams: { id: string; name: string; role: string; mainTeam: boolean }[];
    officeHours?: string | null;
    ohInterest: string[];
    ohHelpWith: string[];
    projectContributions: {
      projectUid: string;
      role: string;
      currentProject: boolean;
      project: { name: string };
    }[];
    repositories: { name: string; description: string; url: string }[];
  };
  experience: { company: string; title: string; isCurrent: boolean; location?: string }[];
  /** A section id on the page: `office-hours`, `experience`, `contributions`, `repositories`, `teams`. */
  onOpen: (target: string) => void;
}

const ICON = {
  member: '/icons/husky/husky-member.svg',
  team: '/icons/husky/husky-team.svg',
  project: '/icons/husky/husky-project.svg',
};

const norm = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ');
const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export function buildMemberAiScope(input: MemberScopeInput): AiSearchScope {
  const { member, experience } = input;
  const first = member.name.split(' ')[0];
  const mainTeam = member.teams.find((t) => t.mainTeam) ?? member.teams[0];

  type Entry = { text: string; icon: string; answer: () => CannedAnswer };
  const entries: Entry[] = [];

  const selfHit: DirectoryHit = {
    name: member.name,
    type: 'member',
    source: `/members/${member.id}`,
    meta: mainTeam ? `${member.role} · ${mainTeam.name}` : member.role,
    avatar: member.profile,
  };
  const teamHits: DirectoryHit[] = member.teams.map((t) => ({
    name: t.name,
    type: 'team',
    source: `/teams/${t.id}`,
    meta: t.role,
  }));

  // Overview → the header and the bio, in one breath.
  entries.push({
    text: `What does ${first} work on?`,
    icon: ICON.member,
    answer: () => ({
      answer: `${member.name} is ${member.role}${mainTeam ? ` at ${mainTeam.name}` : ''}, based in ${
        member.locationLabel
      }. ${member.bio.split('. ')[0]}. Skills listed: ${list(member.skills.map((s) => s.title))}.`,
      sources: [],
      sql: [selfHit, ...teamHits],
      followUpQuestions: [],
      scoped: {
        retrieved: `${member.name}'s profile: role, teams, location, bio and skills`,
        door: { label: 'Open teams', target: 'teams' },
      },
    }),
  });

  // Office Hours → what a booking is for. Only when the card is drawn.
  if (member.officeHours) {
    entries.push({
      text: `What can ${first} help with in office hours?`,
      icon: ICON.member,
      answer: () => ({
        answer: `${first} offers office hours to help with ${list(member.ohHelpWith)}, and is interested in ${list(
          member.ohInterest,
        )}. A short 1:1 call, no introduction needed.`,
        sources: [],
        sql: [selfHit],
        followUpQuestions: [],
        scoped: {
          retrieved: `${member.name}'s office hours: topics of interest, can help with`,
          door: { label: 'Open office hours', target: 'office-hours' },
        },
      }),
    });
  }

  // Experience → where they have worked, current role first.
  if (experience.length) {
    const current = experience.filter((e) => e.isCurrent);
    const past = experience.filter((e) => !e.isCurrent);
    entries.push({
      text: `Where has ${first} worked before?`,
      icon: ICON.team,
      answer: () => ({
        answer: `${
          current.length ? `Now ${list(current.map((e) => `${e.title} at ${e.company}`))}. ` : ''
        }${past.length ? `Before that, ${list(past.map((e) => `${e.title} at ${e.company}`))}.` : ''}`,
        sources: [],
        /* One card per employer. The source is the directory's team search
           for that name, not this profile: a card that links back to the page
           you are on is a door to nowhere (and the answer's cards key on the
           source, so three cards with one URL collided). */
        sql: experience.map(
          (e): DirectoryHit => ({
            name: e.company,
            type: 'team',
            source: `/teams?searchBy=${encodeURIComponent(e.company)}`,
            meta: e.title,
          }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `${member.name}'s experience, ${experience.length} ${experience.length === 1 ? 'entry' : 'entries'}`,
          door: { label: 'Open experience', target: 'experience' },
        },
      }),
    });
  }

  // Project contributions → which projects, and which are current.
  if (member.projectContributions.length) {
    const pcs = member.projectContributions;
    const now = pcs.filter((p) => p.currentProject);
    entries.push({
      text: `Which projects has ${first} contributed to?`,
      icon: ICON.project,
      answer: () => ({
        answer: `${pcs.length} ${pcs.length === 1 ? 'project' : 'projects'}: ${list(
          pcs.map((p) => `${p.project.name} (${p.role})`),
        )}.${now.length ? ` ${list(now.map((p) => p.project.name))} ${now.length === 1 ? 'is' : 'are'} current.` : ''}`,
        sources: [],
        sql: pcs.map(
          (p): DirectoryHit => ({
            name: p.project.name,
            type: 'project',
            source: `/projects/${p.projectUid}`,
            meta: p.role,
          }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `${member.name}'s project contributions`,
          door: { label: 'Open contributions', target: 'contributions' },
        },
      }),
    });
  }

  // Repositories → what is on their GitHub, as the card lists it.
  if (member.repositories.length) {
    const repos = member.repositories;
    entries.push({
      text: `What has ${first} open-sourced?`,
      icon: ICON.project,
      answer: () => ({
        answer: `${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'} on the profile: ${list(
          repos.map((r) => `${r.name} (${r.description.replace(/\.$/, '').toLowerCase()})`),
        )}.`,
        sources: [],
        sql: repos.map((r): DirectoryHit => ({ name: r.name, type: 'project', source: r.url, meta: r.description })),
        followUpQuestions: [],
        scoped: {
          retrieved: `${member.name}'s repositories`,
          door: { label: 'Open repositories', target: 'repositories' },
        },
      }),
    });
  }

  /* Follow-ups are the other sections' questions — the next thing to ask
     about the same person, never a network question. */
  const withFollowUps = (text: string, a: CannedAnswer): CannedAnswer => ({
    ...a,
    followUpQuestions: entries
      .filter((e) => e.text !== text)
      .slice(0, 2)
      .map((e) => e.text),
  });

  /* What free questions read: the records the cards draw, in the network
     corpus's shape so the answer's cards render them the same way. */
  const corpus: CorpusItem[] = [
    {
      uid: member.id,
      index: 'members',
      name: member.name,
      fields: [
        { field: 'teamMemberRoles.role', content: mainTeam ? `${member.role} at ${mainTeam.name}` : member.role },
        { field: 'skills', content: member.skills.map((s) => s.title).join(', ') },
        { field: 'location', content: member.locationLabel },
      ],
      keywords: [...member.ohHelpWith, ...member.ohInterest, member.bio],
    },
    ...member.teams.map(
      (t): CorpusItem => ({
        uid: t.id,
        index: 'teams',
        name: t.name,
        fields: [{ field: 'teamMemberRoles.role', content: `${member.name}, ${t.role}` }],
      }),
    ),
    ...member.projectContributions.map(
      (p): CorpusItem => ({
        uid: p.projectUid,
        index: 'projects',
        name: p.project.name,
        fields: [{ field: 'role', content: `${p.role}${p.currentProject ? ' · current' : ''}` }],
      }),
    ),
    ...member.repositories.map(
      (r): CorpusItem => ({
        uid: r.name,
        index: 'projects',
        name: r.name,
        fields: [{ field: 'description', content: r.description }],
        keywords: ['repository', 'github', 'open source'],
      }),
    ),
  ];
  const doorFor = (found: CorpusItem[]) =>
    found.some((f) => f.index === 'projects')
      ? { label: 'Open contributions', target: 'contributions' }
      : { label: 'Open teams', target: 'teams' };

  const freeAnswer = (question: string): CannedAnswer => {
    const found = pick(corpus, tokenize(question)).slice(0, 6);
    if (!found.length) {
      return {
        answer: `Nothing on ${member.name}'s profile matches **${question.trim()}**. Remove ${first} from the field to ask the whole network.`,
        sources: [],
        sql: [],
        followUpQuestions: entries.slice(0, 2).map((e) => e.text),
        scoped: { retrieved: `${member.name}'s profile matching "${question.trim()}"` },
      };
    }
    return {
      answer: `${found.length} ${found.length === 1 ? 'record' : 'records'} on ${member.name}'s profile ${
        found.length === 1 ? 'matches' : 'match'
      } your question: ${list(found.map((f) => f.name))}.`,
      sources: [],
      sql: found.map(hit),
      followUpQuestions: entries.slice(0, 2).map((e) => e.text),
      scoped: { retrieved: `${member.name}'s profile matching "${question.trim()}"`, door: doorFor(found) },
    };
  };

  return {
    uid: member.id,
    kind: 'member',
    name: member.name,
    logo: member.profile,
    prompts: entries.map(({ text, icon }) => ({ text, icon })),
    answer: (question) => {
      const q = norm(question);
      const entry = entries.find((e) => norm(e.text) === q);
      return entry ? withFollowUps(entry.text, entry.answer()) : freeAnswer(question);
    },
    onOpen: input.onOpen,
  };
}
