import type { FoundItem } from '@/services/search/types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { CORPUS, hit, pick, tokenize, type CannedAnswer, type CorpusItem, type DirectoryHit } from './mocks';
import type { AiSearchScope } from './scope';

/**
 * Scopes built from the search corpus, for the popover's per-row "Ask AI":
 * a team or a member reached from a result row has only what the directory
 * index knows about it, so the prompts are those and no more. The team
 * profile builds a richer team scope from its own sections
 * (`team-profile/aiSearchScope.ts`).
 *
 * The door leads to the record's own page, where the sections are.
 */
export function buildCorpusScope(found: FoundItem): AiSearchScope {
  return found.index === 'members' ? buildMemberScope(found) : buildTeamScope(found);
}

type Entry = { text: string; icon: string; answer: () => CannedAnswer };

const ICON = {
  member: '/icons/husky/husky-member.svg',
  team: '/icons/husky/husky-team.svg',
  event: '/icons/husky/husky-event.svg',
};

const norm = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ');
const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
const field = (item: CorpusItem | undefined, key: string) => item?.fields.find((f) => f.field === key)?.content ?? '';
const splitList = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
/** "Research Engineer at Fenix Labs" → ["Research Engineer", "Fenix Labs"]. */
const roleParts = (item: CorpusItem | undefined) => {
  const [title, team] = field(item, 'teamMemberRoles.role').split(' at ');
  return { title: title ?? '', team: team ?? '' };
};

/** The scope's shared tail: canned prompts, then a free question over its records. */
function finish(
  found: FoundItem,
  kind: AiSearchScope['kind'],
  logo: string,
  entries: Entry[],
  scopeCorpus: CorpusItem[],
  door: { label: string; target: string },
): AiSearchScope {
  const name = found.name;
  const withFollowUps = (text: string, a: CannedAnswer): CannedAnswer => ({
    ...a,
    followUpQuestions: entries.filter((e) => e.text !== text).map((e) => e.text),
  });
  const freeAnswer = (question: string): CannedAnswer => {
    const hits = pick(scopeCorpus, tokenize(question));
    const retrieved = `what the directory holds about ${name}, matching "${question.trim()}"`;
    if (!hits.length) {
      return {
        answer: `Nothing the directory holds about **${name}** matches **${question.trim()}**. Remove ${name} from the field to ask the whole network.`,
        sources: [],
        sql: [],
        followUpQuestions: entries.map((e) => e.text),
        scoped: { retrieved },
      };
    }
    return {
      answer: `${hits.length} ${hits.length === 1 ? 'record' : 'records'} about ${name} ${
        hits.length === 1 ? 'matches' : 'match'
      }: ${list(hits.map((f) => f.name))}.`,
      sources: [],
      sql: hits.map(hit) as DirectoryHit[],
      followUpQuestions: entries.map((e) => e.text),
      scoped: { retrieved, door },
    };
  };
  return {
    uid: found.uid,
    kind,
    name,
    logo,
    prompts: entries.map(({ text, icon }) => ({ text, icon })),
    answer: (question) => {
      const entry = entries.find((e) => norm(e.text) === norm(question));
      return entry ? withFollowUps(entry.text, entry.answer()) : freeAnswer(question);
    },
    /* The door is a route; the popover's host follows it as a plain link. */
    onOpen: (target) => {
      window.location.assign(target);
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Team                                                                       */
/* ------------------------------------------------------------------------ */

function buildTeamScope(found: FoundItem): AiSearchScope {
  const team = CORPUS.find((c) => c.uid === found.uid && c.index === 'teams');
  const name = found.name;
  const description = field(team, 'shortDescription');
  const location = field(team, 'location');
  const tags = splitList(field(team, 'industryTags'));

  const members = CORPUS.filter((c) => c.index === 'members' && roleParts(c).team.toLowerCase() === name.toLowerCase());
  const related = CORPUS.filter(
    (c) =>
      (c.index === 'projects' || c.index === 'events') &&
      tags.some((t) => c.fields.some((f) => f.content.toLowerCase().includes(t.toLowerCase()))),
  );
  const door = { label: 'Open team profile', target: `/teams/${found.uid}` };
  const retrievedFrom = `the ${name} team record`;

  const entries: Entry[] = [
    {
      text: `What does ${name} work on?`,
      icon: ICON.team,
      answer: () => ({
        answer: `${description || `${name} has no description on its profile yet.`}${
          location ? ` Based in ${location}` : ''
        }${tags.length ? `, tagged ${list(tags)}.` : '.'}`,
        sources: [],
        sql: team ? [hit(team)] : [],
        followUpQuestions: [],
        scoped: { retrieved: `${retrievedFrom}: description, location, tags`, door },
      }),
    },
    {
      text: `Who at ${name} is in the directory?`,
      icon: ICON.member,
      answer: () => ({
        answer: members.length
          ? `${members.length} ${members.length === 1 ? 'member lists' : 'members list'} ${name} as their team: ${list(
              members.map((m) => `${m.name} (${roleParts(m).title})`),
            )}.${members.some((m) => m.availableToConnect) ? ' Those with office hours open are marked.' : ''}`
          : `Nobody in the directory lists ${name} as their team yet.`,
        sources: [],
        sql: members.map(hit),
        followUpQuestions: [],
        scoped: { retrieved: `members whose role names ${name}`, door },
      }),
    },
    {
      text: `Which projects and events touch ${name}'s focus?`,
      icon: ICON.event,
      answer: () => ({
        answer: related.length
          ? `${related.length} ${related.length === 1 ? 'record shares' : 'records share'} ${name}'s tags (${list(
              tags,
            )}): ${list(related.map((r) => r.name))}.`
          : `Nothing else in the directory shares ${name}'s tags yet.`,
        sources: [],
        sql: related.map(hit),
        followUpQuestions: [],
        scoped: { retrieved: `projects and events tagged ${list(tags)}`, door },
      }),
    },
  ];

  return finish(
    found,
    'team',
    found.image || '/icons/team-default-profile.svg',
    entries,
    [...(team ? [team] : []), ...members, ...related],
    door,
  );
}

/* ------------------------------------------------------------------------ */
/* Member                                                                     */
/* ------------------------------------------------------------------------ */

function buildMemberScope(found: FoundItem): AiSearchScope {
  const member = CORPUS.find((c) => c.uid === found.uid && c.index === 'members');
  const name = found.name;
  const first = name.split(' ')[0];
  const { title, team: teamName } = roleParts(member);
  const skills = splitList(field(member, 'skills'));
  const location = field(member, 'location');
  const team = CORPUS.find((c) => c.index === 'teams' && c.name.toLowerCase() === teamName.toLowerCase());
  const teammates = CORPUS.filter(
    (c) => c.index === 'members' && c.uid !== found.uid && roleParts(c).team.toLowerCase() === teamName.toLowerCase(),
  );
  const door = { label: 'Open profile', target: `/members/${found.uid}` };
  const retrievedFrom = `${name}'s member record`;

  const entries: Entry[] = [
    {
      text: `What does ${first} work on?`,
      icon: ICON.member,
      answer: () => ({
        answer: `${name} is ${title ? `${title}${teamName ? ` at ${teamName}` : ''}` : 'in the directory'}${
          location ? `, based in ${location}` : ''
        }.${skills.length ? ` Skills listed: ${list(skills)}.` : ''}`,
        sources: [],
        sql: [...(member ? [hit(member)] : []), ...(team ? [hit(team)] : [])],
        followUpQuestions: [],
        scoped: { retrieved: `${retrievedFrom}: role, location, skills`, door },
      }),
    },
    {
      text: `Does ${first} offer office hours?`,
      icon: ICON.member,
      answer: () => ({
        answer: member?.availableToConnect
          ? `Yes. ${first} has office hours open, so you can book time from the profile.`
          : `Not right now. ${first} hasn't opened office hours; the profile's contact links are the way in.`,
        sources: [],
        sql: member ? [hit(member)] : [],
        followUpQuestions: [],
        scoped: { retrieved: `${retrievedFrom}: office hours`, door },
      }),
    },
    {
      text: teamName ? `Who else is at ${teamName}?` : `Which team is ${first} on?`,
      icon: ICON.team,
      answer: () => ({
        answer: !teamName
          ? `${name} isn't listed on a team yet.`
          : teammates.length
            ? `${list(teammates.map((m) => `${m.name} (${roleParts(m).title})`))} ${
                teammates.length === 1 ? 'is' : 'are'
              } also at ${teamName}.`
            : `${first} is the only ${teamName} member in the directory so far.`,
        sources: [],
        sql: [...(team ? [hit(team)] : []), ...teammates.map(hit)],
        followUpQuestions: [],
        scoped: { retrieved: `members whose role names ${teamName || 'a team'}`, door },
      }),
    },
  ];

  return finish(
    found,
    'member',
    found.image || getDefaultAvatar(name),
    entries,
    [...(member ? [member] : []), ...(team ? [team] : []), ...teammates],
    door,
  );
}
