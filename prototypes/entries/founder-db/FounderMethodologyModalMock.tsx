'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { Markdown } from '@/components/common/Markdown';
// Reuse the production methodology-modal styling so the prototype tracks production 1:1.
import s from '@/components/page/founders/FounderMethodologyModal/FounderMethodologyModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

// Mutation-free copy of FounderMethodologyModal — static mocked methodology instead
// of the useGetFounderMethodology query.
const MOCK_VERSION = 'v2.3.0';
const MOCK_GENERATED_AT = '2026-06-20T09:00:00.000Z';

const MOCK_METHODOLOGY_MD = `
## How this database is built

The Founder DB continuously ingests potential founders from public signals, scores them
against each fund's thesis, and surfaces the strongest matches for the investment team to
review and approve into Affinity.

### Funds
- **PLVS** — AI-native infrastructure, agents, and developer tooling.
- **Neuro** — neurotech, brain–computer interfaces, and neuromorphic hardware.
- **Crypto** — zero-knowledge, decentralized infrastructure, and on-chain primitives.

### Signals we read
GitHub, arXiv, LinkedIn, Crunchbase, press, and community forums. Each record keeps full
provenance so any claim can be traced back to its source.

### Scores
- **Alignment %** — confidence that a founder matches their best-fit fund's thesis.
- **PLVS Score** — a deterministic 0–100 investment score for PLVS-tagged founders.
- **PLN Proximity** — graph-distance to the Protocol Labs network (a reachability signal,
  not a thesis-fit signal).

Alignment and PLN proximity are independent — a founder can be a strong thesis fit yet far
from the network, or close to the network with weak thesis fit.
`;

export function FounderMethodologyModalMock({ open, onClose, triggerRef }: Props) {
  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={s.backdrop} />
        <Dialog.Popup className={s.popup} id="founder-methodology-panel" aria-labelledby="founder-methodology-title">
          <header className={s.header}>
            <Dialog.Title id="founder-methodology-title" className={s.title}>
              About this data
            </Dialog.Title>
            <button type="button" className={s.close} onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </header>

          <div className={s.body}>
            <div className={s.markdown}>
              <Markdown>{MOCK_METHODOLOGY_MD}</Markdown>
            </div>
          </div>

          <footer className={s.footer}>
            <span>Version {MOCK_VERSION}</span>
            <span>
              Generated{' '}
              {new Date(MOCK_GENERATED_AT).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
