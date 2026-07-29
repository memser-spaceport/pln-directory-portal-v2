'use client';

import { ReactNode, useCallback, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { clearFormDraft } from '@/utils/formDraftStorage';

import { ALL_DRAFT_KEYS, CONTRACT, COVERED_SURFACES, mockPage } from './mocks';
import { InlineComposer } from './components/InlineComposer';
import { PageComposer } from './components/PageComposer';
import { FeedbackModalDemo } from './components/FeedbackModalDemo';
import { NotePopoverDemo } from './components/NotePopoverDemo';
import s from './styles.module.scss';

type Mode = 'today' | 'proposed';

interface DemoProps {
  tier: string;
  title: string;
  subtitle: string;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  children: ReactNode;
}

function Demo({ tier, title, subtitle, mode, onModeChange, children }: DemoProps) {
  return (
    <section className={s.demo}>
      <header className={s.demoHeader}>
        <div className={s.demoHeading}>
          <div className={s.demoTitleRow}>
            <h3 className={s.demoTitle}>{title}</h3>
            <span className={s.tierTag}>{tier}</span>
          </div>
          <p className={s.demoSubtitle}>{subtitle}</p>
        </div>

        <div className={s.modeSwitch} role="group" aria-label={`${title} behaviour`}>
          {(['today', 'proposed'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={clsx(s.modeBtn, mode === m && s.modeBtnActive)}
              onClick={() => onModeChange(m)}
              aria-pressed={mode === m}
            >
              {m === 'today' ? 'Today' : 'Proposed'}
            </button>
          ))}
        </div>
      </header>

      <div className={s.demoBody}>{children}</div>
    </section>
  );
}

export default function InputInteractionsPrototype() {
  // Per-demo mode, so a reviewer can hold one surface in "today" while
  // comparing against another in "proposed" rather than flipping the world.
  const [modes, setModes] = useState<Record<string, Mode>>({
    inline: 'proposed',
    page: 'proposed',
    modal: 'proposed',
    popover: 'proposed',
  });

  // Remounting every demo is how "reload" is simulated without actually
  // reloading — the draft layer is the only thing that survives it.
  const [generation, setGeneration] = useState(0);

  const setMode = useCallback(
    (key: string) => (mode: Mode) => setModes((current) => ({ ...current, [key]: mode })),
    [],
  );

  const simulateReload = () => setGeneration((g) => g + 1);

  const clearAllDrafts = () => {
    ALL_DRAFT_KEYS.forEach(clearFormDraft);
    setGeneration((g) => g + 1);
  };

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{mockPage.title}</h1>
        <p className={s.description}>{mockPage.description}</p>
      </header>

      <div className={s.contract}>
        {CONTRACT.map((rule, i) => (
          <div key={rule.id} className={s.contractItem}>
            <span className={s.contractIndex}>{i + 1}</span>
            <div>
              <p className={s.contractLabel}>{rule.label}</p>
              <p className={s.contractDetail}>{rule.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={s.toolbar}>
        <Button style="border" variant="neutral" size="s" onClick={simulateReload}>
          Simulate reload
        </Button>
        <Button style="link" variant="neutral" size="s" onClick={clearAllDrafts}>
          Clear all drafts
        </Button>
        <span className={s.toolbarNote}>
          Drafts are real — written to localStorage under a <code>form-draft:proto:input-interactions:*</code>{' '}
          namespace, so an actual browser refresh works too.
        </span>
      </div>

      <Demo
        tier="Tier 1"
        title="Inline composer"
        subtitle="Forum comment and reply, guides comment. Outside-click is already handled; surviving the page is not."
        mode={modes.inline}
        onModeChange={setMode('inline')}
      >
        <InlineComposer key={`inline-${modes.inline}-${generation}`} mode={modes.inline} />
      </Demo>

      <Demo
        tier="Tier 1"
        title="Page composer"
        subtitle="Forum create/edit post, guides article. Today a navigation warning stands in for a draft — it interrupts without protecting."
        mode={modes.page}
        onModeChange={setMode('page')}
      >
        <PageComposer key={`page-${modes.page}-${generation}`} mode={modes.page} />
      </Demo>

      <Demo
        tier="Tier 2"
        title="Modal with free text"
        subtitle="Contact support, Demo Day feedback and referrals, Deals report-a-problem, Husky feedback, office-hours rating."
        mode={modes.modal}
        onModeChange={setMode('modal')}
      >
        <FeedbackModalDemo key={`modal-${modes.modal}-${generation}`} mode={modes.modal} />
      </Demo>

      <Demo
        tier="Tier 2"
        title="Anchored popover"
        subtitle="Gantry decline reason and pin note, Asks add/edit. Dismissal weight follows content, not component type."
        mode={modes.popover}
        onModeChange={setMode('popover')}
      >
        <NotePopoverDemo key={`popover-${modes.popover}-${generation}`} mode={modes.popover} />
      </Demo>

      <section className={s.coverage}>
        <h3 className={s.coverageTitle}>What each demo stands in for</h3>
        <div className={s.coverageTable}>
          {COVERED_SURFACES.map((row) => (
            <div key={row.demo} className={s.coverageRow}>
              <span className={s.tierTag}>{row.tier}</span>
              <span className={s.coverageDemo}>{row.demo}</span>
              <span className={s.coverageSurfaces}>{row.surfaces.join(' · ')}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
