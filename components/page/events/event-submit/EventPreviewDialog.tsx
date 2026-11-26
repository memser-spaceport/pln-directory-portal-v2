'use client';

import { useId } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EventSummary } from '@/components/page/events/EventDrawer/EventSummary';
import type { EventDetail } from '@/services/events/event-drawer.types';

import s from './EventPreviewDialog.module.scss';

/** Preview: the event as LabOS will show it, from the values typed so far. "Back" returns to the form. */
export function EventPreviewDialog({ event, onBack }: { event: EventDetail | null; onBack: () => void }) {
  const titleId = useId();
  return (
    <Modal isOpen={!!event} onClose={onBack} ariaLabelledBy={titleId} lockScroll inertBackground>
      <div className={s.dialog}>
        <div className={s.head}>
          <h2 id={titleId} className={s.title}>
            Preview
          </h2>
          <Button type="button" style="border" variant="neutral" size="s" onClick={onBack}>
            Back
          </Button>
        </div>
        <div className={s.body}>{event && <EventSummary event={event} />}</div>
      </div>
    </Modal>
  );
}
