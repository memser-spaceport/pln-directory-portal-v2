'use client';

import { Drawer } from '@/components/common/Drawer/Drawer';
import s from './WarmIntrosV2GlossaryDrawer.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Warm Intros v2 vocabulary: proximity codes, caliber, score %, score colors.
 * Forked from v1 GlossaryModal layout; content is v2-specific (do not change v1).
 */
export function WarmIntrosV2GlossaryDrawer({ open, onClose }: Props) {
  return (
    <Drawer isOpen={open} onClose={onClose} width={560}>
      <div className={s.body}>
        <header className={s.header}>
          <h2 className={s.title}>How to read Warm Intros v2</h2>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className={s.lead}>
          v2 ranks <strong>who at PL can introduce you</strong> to each investor using MasterProfile + an LLM pairing
          pass. Affinity email history is only a hint — not the ranking itself.
        </p>

        <section className={s.section}>
          <h3 className={s.h3}>Proximity</h3>
          <p className={s.p}>
            A short code like <code>PL+1A</code> that reads as{' '}
            <strong>
              {'{'}family{'}'}+{'{'}hops{'}'}
              {'{'}caliber{'}'}
            </strong>
            . Family, hop count, and caliber come from the API (<code>proximityCode</code>) — the UI does not invent
            them. Iteration 1 is direct PL connector paths (<code>PL+1…</code>).
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Caliber — A vs B</h3>
          <ul className={s.list}>
            <li>
              <strong>A</strong> — score ≥ 60%.
            </li>
            <li>
              <strong>B</strong> — score &gt; 0% and &lt; 60%.
            </li>
          </ul>
          <p className={s.p}>Matches the backend rule. No caliber when score is 0.</p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Score %</h3>
          <p className={s.p}>
            0–100 strength of the recommended intro path (LLM + evidence). Higher is better. Shown as{' '}
            <code>scorePercent</code> on each row.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Score colors</h3>
          <p className={s.p}>Used on the score % in the results table:</p>
          <ul className={s.list}>
            <li>
              <span className={s.bandGreen}>&gt;60%</span> — green
            </li>
            <li>
              <span className={s.bandYellow}>25–60%</span> — yellow
            </li>
            <li>
              <span className={s.bandRed}>1–25%</span> — red
            </li>
          </ul>
        </section>

        <p className={s.note}>
          Unlike v1 Pathfinder (founder/VC hop graphs), v2 focuses on which of the six PL connectors is the best
          introducer for each investor — grounded in shared entities and model knowledge, not Affinity noise alone.
        </p>
      </div>
    </Drawer>
  );
}
