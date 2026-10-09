import type { SearchResult } from '@/services/search/types';

import { AI_SEARCH_SUGGESTIONS } from '@/services/search/constants';

interface Input {
  term: string;
  results?: SearchResult;
}

interface Suggestion {
  text: string;
  icon: string;
}

const LIMIT = 2;
const MIN_TERM_LENGTH = 2;

const wordsOf = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

// Every typed word starts some word of the question: "fil ber" finds "Filecoin teams in Berlin".
const matches = (text: string, typed: string[]) => {
  const words = wordsOf(text);
  return typed.every((t) => words.some((w) => w.startsWith(t)));
};

function questionsAboutResults(results?: SearchResult): Suggestion[] {
  const team = results?.teams?.[0];
  const member = results?.members?.[0];
  const project = results?.projects?.[0];
  const event = results?.events?.[0];
  return [
    ...(team ? [{ text: `What does ${team.name} work on?`, icon: '/icons/husky/husky-team.svg' }] : []),
    ...(member ? [{ text: `What does ${member.name} work on?`, icon: '/icons/husky/husky-member.svg' }] : []),
    ...(project
      ? [{ text: `Which teams contribute to ${project.name}?`, icon: '/icons/husky/husky-project.svg' }]
      : []),
    ...(event ? [{ text: `Who is attending ${event.name}?`, icon: '/icons/husky/husky-event.svg' }] : []),
  ];
}

export function suggestAiQuestions(input: Input): Suggestion[] {
  const { term, results } = input;

  const typed = wordsOf(term);
  if (term.trim().length < MIN_TERM_LENGTH || !typed.length) {
    return [];
  }
  const seen = new Set<string>();
  return [...AI_SEARCH_SUGGESTIONS, ...questionsAboutResults(results)]
    .filter((suggestion) => {
      if (seen.has(suggestion.text) || !matches(suggestion.text, typed)) {
        return false;
      }
      seen.add(suggestion.text);
      return true;
    })
    .slice(0, LIMIT);
}
