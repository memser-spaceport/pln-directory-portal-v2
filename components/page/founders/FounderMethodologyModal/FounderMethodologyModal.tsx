'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { Markdown } from '@/components/common/Markdown';
import { useGetFounderMethodology } from '@/services/founders/hooks/useGetFounderMethodology';
import type { FounderMethodologyPayload } from '@/services/founders/types';
import s from './FounderMethodologyModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function FounderMethodologyModal({ open, onClose, triggerRef }: Props) {
  const { data, isLoading } = useGetFounderMethodology(open);

  const handleClose = () => {
    onClose();
    triggerRef?.current?.focus();
  };

  const payload = (data?.payload ?? {}) as FounderMethodologyPayload;
  const html =
    typeof payload.how_it_works_html === 'string' && payload.how_it_works_html.trim()
      ? payload.how_it_works_html
      : undefined;
  const markdown =
    !html && typeof payload.how_it_works_markdown === 'string' ? payload.how_it_works_markdown : undefined;
  const generatedAt = typeof payload.generated_at === 'string' ? payload.generated_at : data?.createdAt;
  const version =
    data?.version ?? (typeof payload.methodology_version === 'string' ? payload.methodology_version : undefined);
  const showFooter = !!(version || generatedAt);

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
            {isLoading && <p className={s.muted}>Loading methodology…</p>}

            {!isLoading && !data && (
              <p className={s.empty}>Methodology will appear after the first data push.</p>
            )}

            {!isLoading && data && html && (
              <div className={s.htmlContent} dangerouslySetInnerHTML={{ __html: html }} />
            )}

            {!isLoading && data && !html && markdown && (
              <div className={s.markdown}>
                <Markdown>{markdown}</Markdown>
              </div>
            )}

            {!isLoading && data && !html && !markdown && (
              <p className={s.empty}>Methodology content is not available for this version.</p>
            )}
          </div>

          {!isLoading && data && showFooter && (
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
