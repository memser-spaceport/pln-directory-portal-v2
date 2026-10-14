import type { SearchResult } from '@/services/search/types';

import { ArrowUpRightIcon } from '@/components/icons';
import { HighlightedText } from '@/components/core/application-search/components/HighlightedText';

import { suggestAiQuestions } from './utils/suggestAiQuestions';

import s from './AiSearchEntries.module.scss';

interface Props {
  term: string;
  results?: SearchResult;
  onAsk: (question?: string) => void;
}

export const AiSearchEntries = (props: Props) => {
  const { term, results, onAsk } = props;

  const question = term.trim();
  const suggestions = suggestAiQuestions({ term: question, results });

  return (
    <div className={s.root}>
      <button type="button" className={s.row} onClick={() => onAsk(question || undefined)}>
        <span className={s.aiIcon} aria-hidden="true" />
        <span className={s.text}>
          {question ? <>Chat with AI Search about &ldquo;{question}&rdquo;</> : 'Ask AI Search a question'}
        </span>
        <ArrowUpRightIcon className={s.arrow} aria-hidden="true" />
      </button>
      {suggestions.length > 0 && (
        <ul className={s.list}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.text}>
              <button type="button" className={s.row} onClick={() => onAsk(suggestion.text)}>
                <img className={s.icon} src={suggestion.icon} alt="" width={20} height={20} />
                <span className={s.text}>
                  <HighlightedText text={suggestion.text} query={question} />
                </span>
                <ArrowUpRightIcon className={s.arrow} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
