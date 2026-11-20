'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { EVENT_FORM_TEXT, eventInstants, groupAgendaByDay } from '@/services/events/event-form';
import { parseAgenda } from '@/services/events/event-submission.service';
import type { EventBodyAgenda, EventFormValues } from '@/services/events/event-submission.types';

import { AgendaFormatCard } from './AgendaFormatCard';
import { EventFormDialog } from './EventFormDialog';
import f from './EventForm.module.scss';
import s from './AgendaBox.module.scss';

const NO_TIMES = 'Could not find agenda times in this text. Add a time to each item.';
const FAILED = 'Could not read the agenda. Please try again.';

/** The text the box starts with: what the person pasted, or the stored sessions written out when there is none. */
function agendaText(agenda: EventBodyAgenda | null, timezone: string): string {
  if (agenda?.agendaSummary) return agenda.agendaSummary;
  return groupAgendaByDay(agenda, timezone)
    .map((day) =>
      [
        day.date,
        ...day.items.map((item) => [`${item.time} • ${item.title}`, item.description].filter(Boolean).join('\n')),
      ].join('\n'),
    )
    .join('\n\n');
}

/**
 * The agenda box: a sample, one text area, "Cancel" and "Add". "Add" sends the text to the agenda parser with the
 * event's start, end and time zone, and stores the sessions it returns. Any message keeps the box open with the text.
 */
export function AgendaBox({ onClose }: { onClose: () => void }) {
  const { getValues, setValue, clearErrors } = useFormContext<EventFormValues>();
  const [text, setText] = useState(() => agendaText(getValues('agenda'), getValues('timezone')));
  const [message, setMessage] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const closed = useRef(false);

  useEffect(() => {
    closed.current = false;
    return () => {
      closed.current = true;
    };
  }, []);

  const add = async () => {
    const values = getValues();
    if (!values.startDay || !values.endDay) {
      setMessage(EVENT_FORM_TEXT.agendaNeedsDates);
      return;
    }
    const instants = eventInstants(values);
    if (!instants) {
      setMessage(EVENT_FORM_TEXT.agendaNeedsEventDates);
      return;
    }
    setMessage(null);
    setReading(true);
    try {
      const parsed = await parseAgenda({
        text,
        startDate: instants.start,
        endDate: instants.end,
        timezone: values.timezone,
      });
      if (closed.current) return;
      if (!parsed.sessions.length) {
        setMessage(parsed.message || NO_TIMES);
        return;
      }
      setValue('agenda', { sessions: parsed.sessions, agendaSummary: text }, { shouldDirty: true });
      clearErrors('agenda');
      onClose();
    } catch {
      if (!closed.current) setMessage(FAILED);
    } finally {
      if (!closed.current) setReading(false);
    }
  };

  return (
    <EventFormDialog
      title="Agenda"
      onClose={onClose}
      closeOnBackdropClick={false}
      actions={
        <>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={reading || !text.trim()} aria-busy={reading}>
            Add
          </Button>
        </>
      }
    >
      <AgendaFormatCard />
      <textarea
        className={s.text}
        placeholder="Paste or Type Date, Time, Title and Description of the Agenda"
        aria-label="Agenda text"
        value={text}
        readOnly={reading}
        autoFocus
        onChange={(event) => {
          setText(event.target.value);
          setMessage(null);
        }}
      />
      {message && (
        <p className={f.error} role="alert">
          {message}
        </p>
      )}
    </EventFormDialog>
  );
}
