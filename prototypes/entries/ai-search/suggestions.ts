import { CORPUS, FOUNDER_PROMPTS, SUGGESTED_PROMPTS, type CorpusItem } from './mocks';
import type { AiSearchViewer } from './viewer';

/**
 * Question suggestions while typing — the thing Perplexity and Gemini both do
 * and this search didn't: you type "fil" and are offered whole questions, so
 * the field teaches what it can be asked one keystroke at a time.
 *
 * Mocked the way the real thing would be fed: a pool of questions that have
 * good answers (the idle prompts, plus what people ask next), and questions
 * written from the directory's own records — type a team's name and you are
 * offered what can be asked *about that team*. A suggestion is a question that
 * gets a grounded answer here, never a guess at the rest of a sentence.
 */

export interface QuerySuggestion {
  text: string;
  /** The per-type glyph the idle prompts wear: what kind of thing it finds. */
  icon: string;
}

const ICON = {
  team: '/icons/husky/husky-team.svg',
  member: '/icons/husky/husky-member.svg',
  project: '/icons/husky/husky-project.svg',
  event: '/icons/husky/husky-event.svg',
};

/** Standalone questions the corpus answers, beyond the idle prompts. */
const POOL: QuerySuggestion[] = [
  { text: 'Who at Lumen Storage offers office hours?', icon: ICON.member },
  { text: 'Find members with office hours in Berlin', icon: ICON.member },
  { text: 'Find members with office hours in Lisbon', icon: ICON.member },
  { text: 'Which Filecoin teams are in Lisbon?', icon: ICON.team },
  { text: 'Which teams work on zero-knowledge proofs?', icon: ICON.team },
  { text: 'Which projects use IPFS?', icon: ICON.project },
  { text: 'Are there Filecoin events in Berlin?', icon: ICON.event },
  { text: 'Who is attending IPFS Camp Lisbon?', icon: ICON.event },
];

/** What can be asked about one record, by its kind. */
function questionsAbout(item: CorpusItem, viewer: AiSearchViewer): QuerySuggestion[] {
  switch (item.index) {
    case 'teams':
      return [
        { text: `What does ${item.name} work on?`, icon: ICON.team },
        { text: `Who at ${item.name} offers office hours?`, icon: ICON.member },
      ];
    case 'members':
      /* An investor: who they are — and, for a founder, the way to them. The
         intro question leads, because it is the one only this seat can ask. */
      if (item.uid.startsWith('mp-inv-')) {
        return [
          ...(viewer === 'founder' ? [{ text: `Who can introduce me to ${item.name}?`, icon: ICON.member }] : []),
          { text: `Who is ${item.name}?`, icon: ICON.member },
        ];
      }
      return [
        { text: `What does ${item.name} work on?`, icon: ICON.member },
        { text: `Does ${item.name} offer office hours?`, icon: ICON.member },
      ];
    case 'projects':
      return [{ text: `Which teams contribute to ${item.name}?`, icon: ICON.project }];
    case 'events':
      return [{ text: `Who is attending ${item.name}?`, icon: ICON.event }];
  }
}

const wordsOf = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** What was typed, as lowercase word-starts. One-letter words count: "zk b" is a query. */
export const suggestionTokens = (input: string) => wordsOf(input);

/** Every typed word starts some word of the text: "fil ber" finds "Filecoin in Berlin". */
const matches = (text: string, tokens: string[]) => {
  const words = wordsOf(text);
  return tokens.every((t) => words.some((w) => w.startsWith(t)));
};

/**
 * Up to `limit` questions for what has been typed so far. Nothing under two
 * characters — one letter matches everything and says nothing.
 *
 * `pool` replaces the network's questions with a scope's own (its prompts),
 * and the record-written questions are dropped with them: inside "About
 * Protocol Labs" a question about another team is not on offer.
 */
export function suggestQuestions(
  input: string,
  { limit = 6, viewer = 'member', pool }: { limit?: number; viewer?: AiSearchViewer; pool?: QuerySuggestion[] } = {},
): QuerySuggestion[] {
  const typed = input.trim().toLowerCase();
  if (typed.length < 2) return [];
  const tokens = suggestionTokens(typed);
  if (!tokens.length) return [];

  const written = pool
    ? []
    : CORPUS.filter((item) => tokens.some((t) => wordsOf(item.name).some((w) => w.startsWith(t)))).flatMap((item) =>
        questionsAbout(item, viewer),
      );
  const candidates = pool ?? [
    ...(viewer === 'founder' ? FOUNDER_PROMPTS : []),
    ...SUGGESTED_PROMPTS,
    ...POOL,
    ...written,
  ];

  const seen = new Set<string>();
  return (
    candidates
      .filter((c) => {
        const key = c.text.toLowerCase();
        /* The question already typed out in full is not a suggestion. */
        if (key === typed || seen.has(key) || !matches(c.text, tokens)) return false;
        seen.add(key);
        return true;
      })
      /* A question that *continues* what was typed leads; the rest keep the
         order above (prompts, pool, then the record's own). `sort` is stable. */
      .sort((a, b) => Number(b.text.toLowerCase().startsWith(typed)) - Number(a.text.toLowerCase().startsWith(typed)))
      .slice(0, limit)
  );
}

/**
 * The text cut into matched and unmatched runs, for painting the typed
 * word-starts the way the result rows under it paint their matches.
 */
export function suggestionSegments(text: string, tokens: string[]): { text: string; match: boolean }[] {
  if (!tokens.length) return [{ text, match: false }];
  const escaped = [...tokens].sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${escaped.join('|')})`, 'giu');
  const out: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), match: false });
    out.push({ text: m[0], match: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out;
}
