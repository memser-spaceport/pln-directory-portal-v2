'use client';

import { Drawer } from '@/components/common/Drawer/Drawer';
import s from './ScoringMethodologyModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Defines the PL Path Finder vocabulary surfaced in the warm-intros workspace:
 * the two axes (proximity vs fit), caliber, connectors, warmth, hops, confidence.
 */
export function GlossaryModal({ open, onClose }: Props) {
  return (
    <Drawer isOpen={open} onClose={onClose} width={560}>
      <div className={s.body}>
        <header className={s.header}>
          <h2 className={s.title}>How to read warm paths</h2>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className={s.lead}>
          Each candidate is scored on <strong>two independent axes</strong>: <strong>Proximity</strong> — how warmly PL
          can reach them — and the relationship signal that proximity is built from. They answer different questions:
          <em> can we reach this investor</em> vs <em>how do we reach them</em>.
        </p>

        <section className={s.section}>
          <h3 className={s.h3}>Proximity</h3>
          <p className={s.p}>
            The reachability of an investor through PL&apos;s network, shown as a code like <code>F+2B</code>. It reads
            as <strong>{'{connector}+{hops}{caliber}'}</strong>. A higher-quality, shorter path is warmer. Investors
            with no path at all are marked <strong>Cold</strong>.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Connector — the &ldquo;door&rdquo; the path goes through</h3>
          <ul className={s.list}>
            <li>
              <strong>F</strong> — a PL <strong>portfolio founder</strong> who knows the investor.
            </li>
            <li>
              <strong>VC</strong> — a <strong>co-investor / known VC</strong> from a shared cap table.
            </li>
            <li>
              <strong>JB</strong> / <strong>PL</strong> — a contact in the <strong>JB</strong> or <strong>PL</strong>{' '}
              rolodex.
            </li>
            <li>
              <strong>O</strong> — some <strong>other</strong> connector. <strong>C</strong> — cold, no path.
            </li>
          </ul>
          <p className={s.p}>
            Connector is a <em>category</em> (which door), not a ranking — F isn&apos;t automatically better than VC.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Hops</h3>
          <p className={s.p}>
            Social distance to the investor: <strong>1</strong> = direct (one introducer), <strong>2</strong> = one
            person in between. Fewer hops is warmer.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Caliber — A or B</h3>
          <p className={s.p}>The strength of the connection, from a two-part gate:</p>
          <ul className={s.list}>
            <li>
              <strong>A</strong> — strong: a real <em>relationship</em> <strong>and</strong> the connector has the{' '}
              <em>standing</em> (prestige / seniority) to make the intro land.
            </li>
            <li>
              <strong>B</strong> — partial: <em>either</em> a relationship <em>or</em> the standing, not both.
            </li>
          </ul>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Warmth &amp; confidence</h3>
          <p className={s.p}>
            <strong>Warmth</strong> is the path&apos;s success probability (0–100%) — the product of each hop&apos;s
            likelihood. <strong>Confidence</strong> is how sure the model is about the computed caliber; it abstains
            (low confidence) when the underlying data is thin.
          </p>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Relationship</h3>
          <ul className={s.list}>
            <li>
              <strong>Co-invested</strong> — on a PL portfolio cap table.
            </li>
            <li>
              <strong>Engaged</strong> — has responded to PL outreach (registered / clicked / opened).
            </li>
            <li>
              <strong>Cold</strong> — no prior relationship; surfaced only on sector / stage fit.
            </li>
          </ul>
          <p className={s.note}>
            Relationship is <em>who we already know</em>; proximity is <em>the warmest way in</em>. An investor can be
            co-invested yet still Cold on proximity if no usable path exists today.
          </p>
        </section>
      </div>
    </Drawer>
  );
}
