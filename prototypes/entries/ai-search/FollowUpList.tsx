'use client';

import { ArrowBendDownRight } from '@phosphor-icons/react';

import s from './FollowUpList.module.scss';

/**
 * Follow-up questions under an answer (2026-11-25 redraw, "update this UI using Mobbin"). Replaces
 * production's `FollowupQuestions` here: an orange chip-icon headline over full-width grey pills, the
 * loudest thing in the answer after the answer itself. Answer surfaces draw these as a quiet list the eye
 * can skip (Searchable's "Follow-ups", Reddit Answers' "Related", Remote's related articles): a 12px label,
 * then rows split by hairlines, each led by a ↳ that says "this continues the thread". Secondary text at
 * rest, primary with a wash on hover. Disabled while an answer streams, as production's are.
 */
export function FollowUpList({
  questions,
  onPick,
  disabled,
}: {
  questions: string[];
  onPick: (question: string) => void;
  disabled?: boolean;
}) {
  if (!questions.length) return null;
  return (
    <section className={s.root} aria-label="Follow-up questions">
      <h3 className={s.label}>Follow-ups</h3>
      <ul className={s.list}>
        {questions.map((q) => (
          <li key={q}>
            <button type="button" className={s.row} onClick={() => onPick(q)} disabled={disabled}>
              <ArrowBendDownRight weight="regular" className={s.glyph} aria-hidden />
              <span className={s.text}>{q}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
