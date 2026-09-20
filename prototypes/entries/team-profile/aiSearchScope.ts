import type { CannedAnswer, CorpusItem, DirectoryHit } from '../ai-search/mocks';
import { hit, pick, tokenize } from '../ai-search/mocks';
import type { AiSearchScope } from '../ai-search/scope';
import type { FeedComment } from '../newsfeed-v0/mocks';
import type { RoleApplicant } from './applicantMocks';
import type { ContributionEvent, TeamFollower } from './mocks';

/**
 * The team profile's scope for the AI Search dialog: what "Ask AI about
 * <team>" can read, which questions it offers, and where each answer's door
 * leads on this page.
 *
 * Every prompt is tied to a section the page renders *for this viewer right
 * now*. No open roles, no applicants prompt; a member who isn't a lead can't
 * read applicants on the page, so the dialog doesn't offer to read them
 * either. The answers are computed from the same fixtures the sections draw,
 * so an answer and the section its door opens always agree.
 *
 * Two prompts differ from the first proposal, because the fixture couldn't
 * back them: members carry no office hours, and the news is from June, so
 * "this week's office hours" and "last month's posts" would have answered
 * nothing. They ask the nearest question the section *can* answer.
 */

export interface TeamScopeInput {
  teamName: string;
  logo: string;
  /** `MOCK_MEMBERS`, in the loose shape the members section reads. */
  members: { id: string; name: string; skills?: { title: string }[]; teams?: { role?: string }[] }[];
  /** The Open roles section's roles, or null when it isn't drawn. */
  roles: { uid: string; roleTitle: string }[] | null;
  applicantsFor: (roleUid: string) => RoleApplicant[];
  /** Leads and admins. The applicants page is theirs. */
  canSeeApplicants: boolean;
  /**
   * On the team's side of the page (admin, lead, member). A visitor asks in
   * the third person and can't read the follower list, so they get neither
   * "our" nor a followers prompt.
   */
  isTeamView: boolean;
  followers: TeamFollower[];
  contributions: ContributionEvent[];
  /** The rail's current posts, empty when the team has none. */
  news: { uid: string; title: string }[];
  commentsFor: (newsUid: string) => FeedComment[];
  onOpen: (target: string) => void;
}

const ICON = {
  member: '/icons/husky/husky-member.svg',
  event: '/icons/husky/husky-event.svg',
  team: '/icons/husky/husky-team.svg',
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const norm = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ');
const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** The team's audience sentence, as the follower list's own note words it. */
const TEAM_ONLY = 'Only visible to your team';
const LEADS_ONLY = 'Only visible to team leads';

export function buildTeamAiScope(input: TeamScopeInput): AiSearchScope {
  const { teamName, members, roles, followers, contributions, news } = input;

  /* ---------------------------------------------------------------------- */
  /* One canned question per section that exists for this viewer            */
  /* ---------------------------------------------------------------------- */

  type Entry = { text: string; icon: string; answer: () => CannedAnswer };
  const entries: Entry[] = [];

  // Open roles → applicants. The role with the most applications this week.
  const role =
    input.canSeeApplicants && roles?.length
      ? [...roles].sort((a, b) => recent(input.applicantsFor(b.uid)).length - recent(input.applicantsFor(a.uid)).length)[0]
      : null;
  if (role && recent(input.applicantsFor(role.uid)).length > 0) {
    const applied = recent(input.applicantsFor(role.uid));
    const unseen = applied.filter((a) => a.unseen).map((a) => a.name.split(' ')[0]);
    entries.push({
      text: `Who applied to ${role.roleTitle} this week?`,
      icon: ICON.member,
      answer: () => ({
        answer: `${applied.length} ${applied.length === 1 ? 'person' : 'people'} applied in the last 7 days. ${
          unseen.length
            ? `${list(unseen)} ${unseen.length === 1 ? 'is' : 'are'} new since your last visit.`
            : "You've opened all of them."
        }`,
        sources: [],
        sql: applied.map(
          (a): DirectoryHit => ({
            name: a.name,
            type: 'member',
            source: `/members/${a.memberId}`,
            meta: a.role,
            avatar: a.avatar,
          }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `applications to ${role.roleTitle}, last 7 days`,
          restrictedTo: LEADS_ONLY,
          door: { label: 'Open applicants', target: `applicants:${role.uid}` },
        },
      }),
    });
  }

  // Followers → who among them is at a fund. The list is team-only on the
  // page (TeamFollowBlock's note), so it is team-only here.
  if (input.isTeamView && followers.length) {
    const atFunds = followers.filter((f) => /capital|ventures|partners|fund|partner\b/i.test(f.role));
    entries.push({
      text: 'Which of our followers work at a fund?',
      icon: ICON.member,
      answer: () => ({
        answer: atFunds.length
          ? `${list(atFunds.map((f) => f.name))} ${atFunds.length === 1 ? 'lists a fund role' : 'list fund roles'} among ${followers.length} followers. The rest are builders, mostly from teams in the network.`
          : `None of the ${followers.length} followers lists a role at a fund. Most are builders from teams in the network.`,
        sources: [],
        sql: atFunds.map(
          (f): DirectoryHit => ({ name: f.name, type: 'member', source: `/members/${f.id}`, meta: f.role, avatar: f.avatar }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `${teamName} followers whose role names a fund`,
          restrictedTo: TEAM_ONLY,
          door: { label: 'Open followers', target: 'followers' },
        },
      }),
    });
  }

  // Members → skills the section already shows on each row.
  if (members.length) {
    const skilled = members.filter((m) => m.skills?.some((s) => /^(go|rust)$/i.test(s.title)));
    entries.push({
      text: `Which ${teamName} members work in Go or Rust?`,
      icon: ICON.member,
      answer: () => ({
        answer: skilled.length
          ? `${list(skilled.map((m) => m.name))} ${skilled.length === 1 ? 'lists' : 'list'} Go or Rust in their skills. That is ${skilled.length} of the ${members.length} members on the profile.`
          : `None of the ${members.length} members lists Go or Rust in their skills.`,
        sources: [],
        sql: skilled.map(
          (m): DirectoryHit => ({
            name: m.name,
            type: 'member',
            source: `/members/${m.id}`,
            meta: m.skills?.map((s) => s.title).join(', '),
          }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `${teamName} members whose skills include Go or Rust`,
          door: { label: 'Open members', target: 'members' },
        },
      }),
    });
  }

  // Contributions → this year's events and the part the team played.
  const thisYear = String(new Date().getFullYear());
  const yearEvents = contributions.filter((e) => e.date?.includes(thisYear));
  if (yearEvents.length) {
    entries.push({
      text: `Which events has ${teamName} hosted or spoken at this year?`,
      icon: ICON.event,
      answer: () => {
        const stage = yearEvents.filter((e) => e.roles.some((r) => r === 'Host' || r === 'Speaker'));
        const hosted = stage.filter((e) => e.roles.includes('Host')).map((e) => e.name);
        const spoke = stage.filter((e) => e.roles.includes('Speaker')).map((e) => e.name);
        return {
          answer: [
            `${stage.length} ${stage.length === 1 ? 'event' : 'events'} this year.`,
            [hosted.length ? `${teamName} hosted ${list(hosted)}` : null, spoke.length ? `spoke at ${list(spoke)}` : null]
              .filter(Boolean)
              .join(' and ') + '.',
          ].join(' '),
          sources: [],
          sql: stage.map(
            (e): DirectoryHit => ({
              name: e.name,
              type: 'event',
              source: `/events/irl?type=past&event=${e.slugURL}`,
              meta: `${e.roles.join(', ')} · ${e.location} · ${e.date}`,
            }),
          ),
          followUpQuestions: [],
          scoped: {
            retrieved: `${teamName} contributions dated ${thisYear}, roles Host or Speaker`,
            door: { label: 'Open contributions', target: 'contributions' },
          },
        };
      },
    });
  }

  // News → the post with the most discussion, and who joined it.
  const discussed = [...news].sort((a, b) => input.commentsFor(b.uid).length - input.commentsFor(a.uid).length)[0];
  if (discussed && input.commentsFor(discussed.uid).length > 0) {
    const thread = input.commentsFor(discussed.uid);
    const people = [...new Map(thread.map((c) => [c.author, c])).values()];
    entries.push({
      text: input.isTeamView
        ? 'Which of our posts drew the most discussion, and who joined in?'
        : `Which ${teamName} posts drew the most discussion, and who joined in?`,
      icon: ICON.team,
      answer: () => ({
        answer: `"${discussed.title}" has ${thread.length} comments from ${people.length} ${people.length === 1 ? 'person' : 'people'}. ${list(
          people.map((p) => p.author),
        )} took part.`,
        sources: [],
        sql: people.map(
          (p): DirectoryHit => ({ name: p.author, type: 'member', source: `/members/${slug(p.author)}`, meta: p.role }),
        ),
        followUpQuestions: [],
        scoped: {
          retrieved: `comments on ${news.length} ${teamName} news ${news.length === 1 ? 'post' : 'posts'}`,
          door: { label: 'Open news', target: 'news' },
        },
      }),
    });
  }

  /* Follow-ups are the other sections' questions: the next thing a lead
     might ask about the same team, never a network question. */
  const withFollowUps = (text: string, a: CannedAnswer): CannedAnswer => ({
    ...a,
    followUpQuestions: entries
      .filter((e) => e.text !== text)
      .slice(0, 2)
      .map((e) => e.text),
  });

  /* ---------------------------------------------------------------------- */
  /* The overview (the first prompt) and free questions                      */
  /* ---------------------------------------------------------------------- */

  const overviewQuestion = `What's happening at ${teamName}?`;
  const overview = (): CannedAnswer => {
    const parts = [
      `${members.length} members on the profile`,
      roles?.length ? `${roles.length} open ${roles.length === 1 ? 'role' : 'roles'}` : null,
      input.isTeamView ? `${followers.length} followers` : null,
      news.length ? `${news.length} news ${news.length === 1 ? 'post' : 'posts'}` : null,
    ].filter(Boolean) as string[];
    const newApplicants =
      input.canSeeApplicants && roles ? roles.flatMap((r) => input.applicantsFor(r.uid)).filter((a) => a.unseen).length : 0;
    return {
      answer: `${teamName} has ${list(parts)}.${
        newApplicants ? ` ${newApplicants} applications haven't been opened yet.` : ''
      } Ask about any of them to see the people behind the numbers.`,
      sources: [],
      sql: members.map(
        (m): DirectoryHit => ({ name: m.name, type: 'member', source: `/members/${m.id}`, meta: m.teams?.[0]?.role }),
      ),
      followUpQuestions: [],
      scoped: {
        retrieved: `${teamName} profile: ${input.isTeamView ? 'members, roles, followers and news' : 'members, roles and news'}`,
        door: { label: 'Open members', target: 'members' },
      },
    };
  };

  entries.unshift({ text: overviewQuestion, icon: ICON.team, answer: overview });

  /* What free questions read: the records the sections draw, in the network
     corpus's shape so the answer's cards render them the same way. */
  const corpus: CorpusItem[] = [
    ...members.map(
      (m): CorpusItem => ({
        uid: m.id,
        index: 'members',
        name: m.name,
        fields: [
          { field: 'teamMemberRoles.role', content: `${m.teams?.[0]?.role ?? 'Member'} at ${teamName}` },
          { field: 'skills', content: m.skills?.map((s) => s.title).join(', ') ?? '' },
        ],
      }),
    ),
    ...contributions.map(
      (e): CorpusItem => ({
        uid: e.uid,
        index: 'events',
        name: e.name,
        fields: [
          { field: 'location', content: e.location ?? '' },
          { field: 'role', content: `${e.roles.join(', ')} · ${e.date}` },
        ],
      }),
    ),
  ];

  const freeAnswer = (question: string): CannedAnswer => {
    const found = pick(corpus, tokenize(question)).slice(0, 6);
    if (!found.length) {
      return {
        answer: `Nothing on the ${teamName} profile matches **${question.trim()}**. Remove ${teamName} from the field to ask the whole network.`,
        sources: [],
        sql: [],
        followUpQuestions: entries.slice(0, 2).map((e) => e.text),
        scoped: { retrieved: `${teamName} members and contributions matching "${question.trim()}"` },
      };
    }
    return {
      answer: `${found.length} ${found.length === 1 ? 'record' : 'records'} on the ${teamName} profile ${
        found.length === 1 ? 'matches' : 'match'
      } your question: ${list(found.map((f) => f.name))}.`,
      sources: [],
      sql: found.map(hit),
      followUpQuestions: entries.slice(0, 2).map((e) => e.text),
      scoped: {
        retrieved: `${teamName} members and contributions matching "${question.trim()}"`,
        door: found.some((f) => f.index === 'members')
          ? { label: 'Open members', target: 'members' }
          : { label: 'Open contributions', target: 'contributions' },
      },
    };
  };

  return {
    uid: slug(teamName),
    kind: 'team',
    name: teamName,
    logo: input.logo,
    prompts: entries.map(({ text, icon }) => ({ text, icon })),
    answer: (question) => {
      const q = norm(question);
      const entry = entries.find((e) => norm(e.text) === q);
      return entry ? withFollowUps(entry.text, entry.answer()) : freeAnswer(question);
    },
    onOpen: input.onOpen,
  };
}

function recent(applicants: RoleApplicant[]) {
  const now = Date.now();
  return applicants.filter((a) => now - new Date(a.appliedAt).getTime() <= WEEK_MS);
}
