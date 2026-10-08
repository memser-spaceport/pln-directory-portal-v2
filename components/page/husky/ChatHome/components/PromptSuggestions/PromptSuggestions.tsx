import { useState, useEffect } from 'react';

import { getChatQuestions } from '@/services/discovery.service';

import s from './PromptSuggestions.module.scss';

const VISIBLE_PROMPT_COUNT = 4;

interface Props {
  onSelect: (prompt: any) => void;
}

export const PromptSuggestions = (props: Props) => {
  const { onSelect } = props;

  const [prompts, setPrompts] = useState<any[]>([]);

  useEffect(() => {
    getChatQuestions()
      .then((res) => {
        setPrompts(Array.isArray(res?.data) ? res.data.slice(0, VISIBLE_PROMPT_COUNT) : []);
      })
      .catch(() => {
        setPrompts([]);
      });
  }, []);

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className={s.root} data-testid="chat-home-prompts">
      <div className={s.title}>Try asking</div>
      <ul className={s.list}>
        {prompts.map((prompt, index) => (
          <li key={prompt.uid}>
            <button type="button" className={s.item} onClick={() => onSelect(prompt)} data-testid={`prompt-${index}`}>
              <img alt="" src={prompt.icon} className={s.icon} />
              <span>{prompt.question}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
