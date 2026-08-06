'use client';

import { Drawer } from '@/components/common/Drawer/Drawer';
import s from './WarmIntrosV2GlossaryDrawer.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Warm Intros v2 vocabulary: score %, score colors.
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
          v2 ranks <strong>who can introduce you</strong> to each investor using MasterProfile + an LLM pairing pass.
          Paths may be a direct Protocol Labs person, or Protocol Labs → founder / co-investor → investor. Affinity
          email history is only a hint — not the ranking itself.
        </p>

        <section className={s.section}>
          <h3 className={s.h3}>Score %</h3>
          <p className={s.p}>
            0–100 strength of the recommended intro path (LLM + evidence). Higher is better — the single metric shown on
            each row and in the investor drawer. Paths below <strong>20%</strong> are hidden.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Score colors</h3>
          <p className={s.p}>Used on the score % in the results table and drawer:</p>
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
          Unlike v1 Pathfinder graphs, v2 ranks LLM-scored intro paths in one list: six PL connectors plus
          founder/co-investor bridges when evidence exists. Grounded in shared entities and model knowledge — not
          Affinity noise alone. The Protocol Labs org hop on bridge paths is not clickable.
        </p>
      </div>
    </Drawer>
  );
}
