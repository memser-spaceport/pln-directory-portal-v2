'use client';

import React, { useEffect, useState } from 'react';

import { buildAnswer } from './mocks';
import {
  AnswerStatus,
  AnswerStatusVariantContext,
  specimenCycleMs,
  type AnswerStatusVariant,
} from './AnswerStatus';
import panel from './AnswerPanel.module.scss';
import s from './LoaderSpecimens.module.scss';

const QUESTION = 'Find teams building on Filecoin in Berlin';

const SPECIMENS: { variant: AnswerStatusVariant; label: string; note: string }[] = [
  {
    variant: 'text',
    label: 'With text',
    note: 'Steps read off the answer; "Taking longer than usual" past the usual wait.',
  },
  {
    variant: 'build',
    label: 'No text',
    note: 'The answer card draws its outline over a 10–15s wait, then keeps shimmering.',
  },
];

/**
 * Both answer loaders, live, on the page itself, so they can be looked at
 * without asking a question and waiting. Each is the real `AnswerStatus` the
 * AI view renders, forced to one variant and restarted on a loop long enough
 * to show its whole run (the text loader's overdue line, the build's finished
 * outline). The question and its hits are the Filecoin prompt's, so the
 * "Found …" step and the result placeholders match what the view shows.
 */
export function LoaderSpecimens() {
  const answer = buildAnswer(QUESTION);

  return (
    <section className={s.root} aria-label="Answer loaders">
      <h2 className={s.heading}>Answer loaders</h2>
      {SPECIMENS.map((spec) => (
        <div key={spec.variant} className={s.specimen}>
          <div className={s.meta}>
            <span className={s.label}>{spec.label}</span>
            <span className={s.note}>{spec.note}</span>
          </div>
          <div className={s.frame}>
            <h3 className={panel.question}>{QUESTION}</h3>
            <AnswerStatusVariantContext.Provider value={spec.variant}>
              <Looping cycleMs={specimenCycleMs(spec.variant)}>
                <AnswerStatus hits={answer.sql} sourceCount={answer.sources.length} scoped={answer.scoped} />
              </Looping>
            </AnswerStatusVariantContext.Provider>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Remounts its child every `cycleMs`, so a loader's clock starts over. */
function Looping({ cycleMs, children }: { cycleMs: number; children: React.ReactNode }) {
  const [run, setRun] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setRun((r) => r + 1), cycleMs);
    return () => clearInterval(t);
  }, [cycleMs]);

  return <React.Fragment key={run}>{children}</React.Fragment>;
}
