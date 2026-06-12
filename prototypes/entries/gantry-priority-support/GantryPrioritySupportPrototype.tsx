'use client';

import { OptionBaseline } from './options/OptionBaseline';
import { Option1ModalPriority } from './options/Option1ModalPriority';
import { Option2InlineChips } from './options/Option2InlineChips';
import { Option3ProgressiveDisclosure } from './options/Option3ProgressiveDisclosure';
import { Option4MoSCoW } from './options/Option4MoSCoW';
import { Option5TwoAxis } from './options/Option5TwoAxis';
import { Option6TokenBudget } from './options/Option6TokenBudget';
import { Option7PersonalRank } from './options/Option7PersonalRank';
import { Option8NoteOnly } from './options/Option8NoteOnly';
import s from './GantryPrioritySupportPrototype.module.scss';

const VARIANTS = [
  {
    id: 'baseline',
    label: 'Current (baseline)',
    description: 'Binary upvote with thumbs-up — production today.',
    Component: OptionBaseline,
  },
  {
    id: 'option-1',
    label: 'Option 1 — Modal priority',
    description: 'Click “I need this” → modal with Low / Important / Blocker dropdown.',
    Component: Option1ModalPriority,
  },
  {
    id: 'option-2',
    label: 'Option 2 — Inline chips',
    description: 'Three chips on the card; one tap to support + set priority.',
    Component: Option2InlineChips,
  },
  {
    id: 'option-3',
    label: 'Option 3 — Progressive disclosure',
    description: 'Quick support defaults to Important; optional “Refine priority”.',
    Component: Option3ProgressiveDisclosure,
  },
  {
    id: 'option-4',
    label: 'Option 4 — MoSCoW',
    description: 'Could have / Should have / Must have — roadmap-native language.',
    Component: Option4MoSCoW,
  },
  {
    id: 'option-5',
    label: 'Option 5 — Importance + Urgency',
    description: 'Two-axis popover (Eisenhower-lite) for richer admin triage.',
    Component: Option5TwoAxis,
  },
  {
    id: 'option-6',
    label: 'Option 6 — Token budget',
    description: 'Quarterly point budget; higher priority costs more points.',
    Component: Option6TokenBudget,
  },
  {
    id: 'option-7',
    label: 'Option 7 — Personal rank list',
    description: 'Support + link to “My priorities” drag-rank view.',
    Component: Option7PersonalRank,
  },
  {
    id: 'option-8',
    label: 'Option 8 — Note only',
    description: 'Binary support + optional “why” note — no structured priority.',
    Component: Option8NoteOnly,
  },
] as const;

export default function GantryPrioritySupportPrototype() {
  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>Gantry — priority support patterns</h1>
        <p className={s.description}>
          Compare the current upvote UX with eight prioritization alternatives. Each card uses the same mocked need;
          interact locally — no API calls. Admin preview strips show how aggregation could look for curators.
        </p>
      </header>

      <div className={s.grid}>
        {VARIANTS.map(({ id, label, description, Component }) => (
          <section key={id} className={s.variant} aria-labelledby={`${id}-heading`}>
            <div className={s.variantHeader}>
              <h2 id={`${id}-heading`} className={s.variantTitle}>
                {label}
              </h2>
              <p className={s.variantDescription}>{description}</p>
            </div>
            <Component />
          </section>
        ))}
      </div>
    </div>
  );
}
