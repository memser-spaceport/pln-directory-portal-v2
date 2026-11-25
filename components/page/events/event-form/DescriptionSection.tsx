'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormEditor } from '@/components/form/FormEditor';
import { descriptionText, groupAgendaByDay } from '@/services/events/event-form';
import type { EventFormValues } from '@/services/events/event-submission.types';

import { AgendaBox } from './AgendaBox';
import { AgendaList } from './AgendaList';
import { useEventFormContext } from './EventFormContext';
import { FieldError } from './FieldError';
import { RemoveAgendaDialog } from './RemoveAgendaDialog';
import s from './EventForm.module.scss';
import c from './DescriptionSection.module.scss';

const TOOLBAR = [
  ['bold', 'italic', 'strike', 'underline', 'link'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'bullet' }, { list: 'ordered' }],
  [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
];

/** "/agenda" typed as a word of the text, in any case; never part of a tag or of a longer address. */
const AGENDA_COMMAND = /(^|[\s>;])\/agenda(?![^<]*>)/gi;

/**
 * The optional description and the agenda. The editor opens with "Add Description", or at once when the form holds
 * a description or an agenda. Typing "/Agenda" in the description, or the hint under it, opens the agenda box.
 */
export function DescriptionSection() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  const { busy } = useEventFormContext();
  const [opened, setOpened] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [description, agenda, timezone] = watch(['description', 'agenda', 'timezone']);
  const days = groupAgendaByDay(agenda, timezone);
  const hasAgenda = days.length > 0;
  const shown = opened || hasAgenda || !!descriptionText(description ?? '');

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name !== 'description' || !values.description) return;
      const without = values.description.replace(AGENDA_COMMAND, '$1');
      if (without === values.description) return;
      setValue('description', without, { shouldDirty: true });
      setBoxOpen(true);
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const removeAgenda = () => {
    setValue('agenda', null, { shouldDirty: true });
    clearErrors('agenda');
    setConfirming(false);
  };

  return (
    <section className={s.section} data-section="description">
      {!shown ? (
        <button type="button" className={s.textButton} disabled={busy} onClick={() => setOpened(true)}>
          Add Description
        </button>
      ) : (
        <>
          <FormEditor
            name="description"
            label="Description"
            placeholder="Enter description"
            className={c.editor}
            simplified
            toolbarConfig={TOOLBAR}
            enableMentions={false}
            minHeight={160}
            disabled={busy}
          />
          {!hasAgenda && (
            <button type="button" className={c.hint} disabled={busy} onClick={() => setBoxOpen(true)}>
              Type /Agenda to Add Agenda
            </button>
          )}
          {hasAgenda && (
            <div className={c.agenda}>
              <div className={c.agendaHeader}>
                <h3 className={s.sectionTitle}>Agenda</h3>
                <div className={c.agendaActions}>
                  <button type="button" className={s.textButton} disabled={busy} onClick={() => setBoxOpen(true)}>
                    Add/Edit
                  </button>
                  <button type="button" className={c.remove} disabled={busy} onClick={() => setConfirming(true)}>
                    Remove all
                  </button>
                </div>
              </div>
              <AgendaList days={days} />
            </div>
          )}
          <FieldError message={errors.agenda?.message} />
        </>
      )}
      {boxOpen && <AgendaBox onClose={() => setBoxOpen(false)} />}
      {confirming && <RemoveAgendaDialog onCancel={() => setConfirming(false)} onRemove={removeAgenda} />}
    </section>
  );
}
