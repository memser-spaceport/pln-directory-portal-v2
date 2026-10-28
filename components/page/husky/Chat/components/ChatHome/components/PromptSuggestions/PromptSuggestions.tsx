import { useTeamNewsPrompts } from '@/services/team-news/hooks/useTeamNewsPrompts';

import s from './PromptSuggestions.module.scss';

interface Props {
  onSelect: (question: string) => void;
}

export const PromptSuggestions = (props: Props) => {
  const { onSelect } = props;

  const { data } = useTeamNewsPrompts();
  const prompts = Array.isArray(data) ? data : [];

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className={s.root} data-testid="chat-home-prompts">
      <div className={s.title}>Try asking</div>
      <ul className={s.list}>
        {prompts.map((prompt, index) => (
          <li key={prompt.uid}>
            <button
              type="button"
              className={s.item}
              onClick={() => onSelect(prompt.question)}
              data-testid={`prompt-${index}`}
            >
              <img alt="" src="/icons/send-black.svg" className={s.icon} />
              <span>{prompt.question}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
