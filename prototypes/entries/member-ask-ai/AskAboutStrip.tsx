'use client';

import { Button } from '@/components/common/Button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

import s from './AskAboutStrip.module.scss';

interface Props {
  /** The person's first name: the label reads "Ask AI about Maya". */
  firstName: string;
  /** The scope's prompts, in its order; the strip shows the first `max`. */
  prompts: { text: string }[];
  /** A chip: open the AI view already answering this question. */
  onAsk: (question: string) => void;
  /** The text link: open the view idle, field focused, for a question of your own. */
  onAskOwn: () => void;
  max?: number;
}

/**
 * "Ask AI about Maya" — the offer at rest, under the bio.
 *
 * The member profile's Ask AI first shipped as a text link in the header's
 * action cluster (the team profile's door). Mobbin's references for asking
 * about a *person* all put the questions on the page instead: Delphi's "Ask me
 * about" block under the bio with three question chips, Mindtrip's "Questions
 * matching your profile" rows, Fabric's "Ask AI about this note" starters. A
 * link reading "Ask AI" says nothing about what can be asked; three questions
 * say it, and each is one press from its answer (design-thinking lesson 4, the
 * fifth example: an offer that only exists behind a press is being made by
 * nothing).
 *
 * One door, not two: the header link is gone on this page, so the strip is the
 * only way in. The chips are the scope's own prompts — one per card the page
 * renders — so a chip and its answer's door always agree. The last item is a
 * text action for a question of your own; it opens the same view idle, with
 * the scope chip in the field.
 *
 * Chips are control chips (the DS's hover-brand lineage), not label chips: a
 * grey pill with no hover would read as a tag on the person.
 */
export function AskAboutStrip({ firstName, prompts, onAsk, onAskOwn, max = 3 }: Props) {
  /* A phone shows two: three chips stack to three full lines there, and the
     first two (the overview, the office hours) are the ones a visitor on a
     phone is likeliest to want. The rest are one press away as follow-ups. */
  const isMobile = useIsMobile();
  const shown = isMobile ? Math.min(max, 2) : max;
  return (
    <div className={s.root}>
      <div className={s.label}>
        <AiSearchIcon size={14} />
        <span>Ask AI about {firstName}</span>
      </div>
      <ul className={s.chips}>
        {prompts.slice(0, shown).map((p) => (
          <li key={p.text}>
            <button type="button" className={s.chip} onClick={() => onAsk(p.text)}>
              {p.text}
            </button>
          </li>
        ))}
        <li>
          <Button style="link" variant="primary" underline={false} className={s.own} onClick={onAskOwn}>
            Ask your own question
          </Button>
        </li>
      </ul>
    </div>
  );
}
