'use client';

import { Button } from '@/components/common/Button';

import { EventFormDialog } from './EventFormDialog';

interface Props {
  onCancel: () => void;
  onRemove: () => void;
}

/** Asks before "Remove all" drops the agenda. */
export function RemoveAgendaDialog({ onCancel, onRemove }: Props) {
  return (
    <EventFormDialog
      title="Remove All Agenda Items?"
      onClose={onCancel}
      actions={
        <>
          <Button style="border" variant="neutral" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="error" onClick={onRemove}>
            Remove
          </Button>
        </>
      }
    />
  );
}
