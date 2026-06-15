'use client';

import React from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { Markdown } from '@/components/common/Markdown';
import { useGetFounderMethodology } from '@/services/founders/hooks/useGetFounderMethodology';
import s from './FounderMethodologyModal.module.scss';

type MethodologyFund = {
  fund?: string;
  audience?: string;
  surfaces?: string;
};

type MethodologySource = {
  name?: string;
  label?: string;
  category?: string;
  pulls?: string;
  access?: string;
  public_feed?: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function FounderMethodologyModal({ open, onClose, triggerRef }: Props) {
  const { data, isLoading } = useGetFounderMethodology(open);

  if (!open) return null;

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  const payload = data?.payload ?? {};
  const summary = typeof payload.summary === 'string' ? payload.summary : undefined;
  const sourceCounts = payload.source_counts as Record<string, number> | undefined;
  const funds = Array.isArray(payload.funds) ? (payload.funds as MethodologyFund[]) : [];
  const sources = Array.isArray(payload.sources) ? (payload.sources as MethodologySource[]) : [];
  const markdown = typeof payload.how_it_works_markdown === 'string' ? payload.how_it_works_markdown : undefined;
  const generatedAt = typeof payload.generated_at === 'string' ? payload.generated_at : data?.createdAt;
  const version =
    data?.version ?? (typeof payload.methodology_version === 'string' ? payload.methodology_version : undefined);

  return (
    <Drawer isOpen={open} onClose={handleClose} width={640} noBlur>
      <div
        className={s.body}
        id="founder-methodology-panel"
        aria-labelledby="founder-methodology-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            handleClose();
          }
        }}
      >
        <header className={s.header}>
          <h2 id="founder-methodology-title" className={s.title}>
            About this data
          </h2>
          <button type="button" className={s.close} onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </header>

        {isLoading && <p className={s.muted}>Loading methodology…</p>}

        {!isLoading && !data && <p className={s.empty}>Methodology will appear after the first data push.</p>}

        {!isLoading && data && (
          <>
            {summary && <p className={s.summary}>{summary}</p>}

            {sourceCounts && Object.keys(sourceCounts).length > 0 && (
              <section className={s.section}>
                <h3 className={s.h3}>Source coverage</h3>
                <dl className={s.kv}>
                  {Object.entries(sourceCounts).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt>{k.replace(/_/g, ' ')}</dt>
                      <dd>{v.toLocaleString()}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </section>
            )}

            {funds.length > 0 && (
              <section className={s.section}>
                <h3 className={s.h3}>Fund criteria</h3>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Fund</th>
                        <th>Audience</th>
                        <th>Surfaces</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funds.map((f) => (
                        <tr key={f.fund ?? 'unknown'}>
                          <td>{f.fund ?? '—'}</td>
                          <td>{f.audience ?? '—'}</td>
                          <td>{f.surfaces ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {sources.length > 0 && (
              <section className={s.section}>
                <h3 className={s.h3}>Sources ({sources.length})</h3>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Category</th>
                        <th>What it pulls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((src) => (
                        <tr key={src.name ?? src.label}>
                          <td>
                            <div className={s.sourceName}>{src.label ?? src.name}</div>
                            {src.name && src.label && src.name !== src.label && (
                              <div className={s.sourceId}>{src.name}</div>
                            )}
                          </td>
                          <td>{src.category ?? '—'}</td>
                          <td>{src.pulls ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {markdown && (
              <section className={s.section}>
                <h3 className={s.h3}>How it works</h3>
                <div className={s.markdown}>
                  <Markdown>{markdown}</Markdown>
                </div>
              </section>
            )}

            {(version || generatedAt) && (
              <footer className={s.footer}>
                {version && <span>Version {version}</span>}
                {generatedAt && (
                  <span>
                    Generated{' '}
                    {new Date(generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
              </footer>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
