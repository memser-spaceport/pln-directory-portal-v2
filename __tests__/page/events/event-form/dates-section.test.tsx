import '@testing-library/jest-dom';
import { act, fireEvent, screen, within } from '@testing-library/react';

import { DatesSection } from '@/components/page/events/event-form/DatesSection';
import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';

/*
 * The start and end pickers, the time lists and the time zone picker, against the form values they write.
 * `react-calendar` ships as ES modules that Jest does not load, so a stand-in draws the month's days as buttons named
 * like the real ones ("December 3, 2026") and honours the same `minDate` / `maxDate`.
 */

interface CalendarStubProps {
  value: Date | null;
  defaultActiveStartDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onChange: (value: Date) => void;
}

jest.mock('react-calendar', () => ({
  __esModule: true,
  default: function CalendarStub({ value, defaultActiveStartDate, minDate, maxDate, onChange }: CalendarStubProps) {
    const shown = value ?? defaultActiveStartDate ?? new Date();
    const days = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
    return (
      <div>
        {Array.from({ length: days }, (_, index) => {
          const day = new Date(shown.getFullYear(), shown.getMonth(), index + 1);
          const name = day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          return (
            <button
              key={name}
              type="button"
              disabled={(!!minDate && day < minDate) || (!!maxDate && day > maxDate)}
              onClick={() => onChange(day)}
            >
              <abbr aria-label={name}>{index + 1}</abbr>
            </button>
          );
        })}
      </div>
    );
  },
}));

function pickDay(control: string, day: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${control}:`) }));
  fireEvent.click(screen.getByLabelText(day));
}

const timeOption = (list: string, label: string) =>
  Array.from((screen.getByLabelText(list) as HTMLSelectElement).options).find((option) => option.text === label);

function pickZone(search: string, zone: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: /^Time zone:/ }));
  fireEvent.change(screen.getByPlaceholderText('Search timezone'), { target: { value: search } });
  fireEvent.click(screen.getByRole('option', { name: zone }));
}

describe('DatesSection: dates and times', () => {
  it('resets the start time to 12:00 AM when a start date is picked', () => {
    const { form } = renderSection(<DatesSection />, {
      values: { startDay: '2026-12-03', startTime: '10:00', endDay: '2026-12-10', endTime: '18:00' },
    });

    pickDay('Start Date', 'December 5, 2026');

    expect(form.current.getValues()).toMatchObject({
      startDay: '2026-12-05',
      startTime: '00:00',
      endDay: '2026-12-10',
      endTime: '18:00',
    });
    expect(screen.getByLabelText('Start time')).toHaveValue('00:00');
  });

  it('resets the end time to 12:00 AM when an end date is picked', () => {
    const { form } = renderSection(<DatesSection />, {
      values: { startDay: '2026-12-03', startTime: '10:00', endDay: '2026-12-10', endTime: '18:00' },
    });

    pickDay('End Date', 'December 12, 2026');

    expect(form.current.getValues()).toMatchObject({ endDay: '2026-12-12', endTime: '00:00', startTime: '10:00' });
  });

  it('sets the end time to 23:45 when the end day is the start day', () => {
    const { form } = renderSection(<DatesSection />, { values: { startDay: '2026-12-03', startTime: '10:00' } });

    pickDay('End Date', 'December 3, 2026');

    expect(form.current.getValues()).toMatchObject({ endDay: '2026-12-03', endTime: '23:45' });
    expect(screen.getByRole('button', { name: 'End Date: Dec 3, 2026' })).toBeInTheDocument();
  });

  it('disables days after the end in the start calendar and days before the start in the end calendar', () => {
    renderSection(<DatesSection />, { values: { startDay: '2026-12-03', endDay: '2026-12-10' } });

    fireEvent.click(screen.getByRole('button', { name: /^Start Date:/ }));
    expect(screen.getByLabelText('December 11, 2026').closest('button')).toBeDisabled();
    expect(screen.getByLabelText('December 1, 2026').closest('button')).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /^Start Date:/ }));

    fireEvent.click(screen.getByRole('button', { name: /^End Date:/ }));
    expect(screen.getByLabelText('December 2, 2026').closest('button')).toBeDisabled();
    expect(screen.getByLabelText('December 3, 2026').closest('button')).toBeEnabled();
  });

  it('on one day disables end times at or before the start and start times at or after the end', () => {
    renderSection(<DatesSection />, {
      values: { startDay: '2026-12-03', startTime: '10:00', endDay: '2026-12-03', endTime: '18:00' },
    });

    expect(timeOption('End time', '9:45 AM')).toBeDisabled();
    expect(timeOption('End time', '10:00 AM')).toBeDisabled();
    expect(timeOption('End time', '10:15 AM')).toBeEnabled();
    expect(timeOption('Start time', '6:00 PM')).toBeDisabled();
    expect(timeOption('Start time', '6:15 PM')).toBeDisabled();
    expect(timeOption('Start time', '5:45 PM')).toBeEnabled();
  });

  it('offers every time on different days and writes the picked one', () => {
    const { form } = renderSection(<DatesSection />, {
      values: { startDay: '2026-12-03', startTime: '10:00', endDay: '2026-12-04', endTime: '09:00' },
    });

    expect(timeOption('End time', '9:45 AM')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '14:15' } });

    expect(form.current.getValues('startTime')).toBe('14:15');
  });

  it('shows the dates message and clears it when a date changes', async () => {
    const { form } = renderSection(<DatesSection />, { values: { startDay: '2026-12-03' } });
    act(() => form.current.setError('startDay', { type: 'manual', message: 'Start date and end date is required' }));

    expect(await screen.findByText('Start date and end date is required')).toBeInTheDocument();
    pickDay('End Date', 'December 4, 2026');

    expect(screen.queryByText('Start date and end date is required')).not.toBeInTheDocument();
  });
});

describe('DatesSection: time zone', () => {
  it("shows the form's time zone", () => {
    renderSection(<DatesSection />);

    expect(screen.getByRole('button', { name: /^Time zone: Europe\/Lisbon/ })).toBeInTheDocument();
  });

  it('reads "No timezones found" when the search matches nothing', () => {
    renderSection(<DatesSection />);

    fireEvent.click(screen.getByRole('button', { name: /^Time zone:/ }));
    expect(screen.getByRole('option', { name: /^Europe\/Lisbon/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.change(screen.getByPlaceholderText('Search timezone'), { target: { value: 'zzzz' } });

    expect(screen.getByText('No timezones found')).toBeInTheDocument();
    expect(within(screen.getByRole('listbox', { name: 'Time zones' })).queryAllByRole('option')).toHaveLength(0);
  });

  it('picks the highlighted zone with the keyboard', () => {
    const { form } = renderSection(<DatesSection />);

    fireEvent.click(screen.getByRole('button', { name: /^Time zone:/ }));
    const search = screen.getByPlaceholderText('Search timezone');
    fireEvent.change(search, { target: { value: 'asia tokyo' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(form.current.getValues('timezone')).toBe('Asia/Tokyo');
    expect(screen.queryByPlaceholderText('Search timezone')).not.toBeInTheDocument();
  });

  it('keeps the typed clock values and moves the agenda so its clock times stay', () => {
    const { form } = renderSection(<DatesSection />, {
      values: {
        startDay: '2026-01-28',
        startTime: '09:00',
        endDay: '2026-01-28',
        endTime: '18:00',
        agenda: {
          agendaSummary: '10:00 AM - 10:30 AM Opening Ceremony',
          sessions: [
            {
              name: 'Opening Ceremony',
              start_date: '2026-01-28T10:00:00.000Z',
              end_date: '2026-01-28T10:30:00.000Z',
              timezone: 'Europe/Lisbon',
            },
          ],
        },
      },
    });

    pickZone('Tokyo', /^Asia\/Tokyo/);

    const values = form.current.getValues();
    expect(values).toMatchObject({
      timezone: 'Asia/Tokyo',
      startDay: '2026-01-28',
      startTime: '09:00',
      endDay: '2026-01-28',
      endTime: '18:00',
    });
    expect(values.agenda?.sessions[0]).toMatchObject({
      start_date: '2026-01-28T01:00:00.000Z',
      end_date: '2026-01-28T01:30:00.000Z',
      timezone: 'Asia/Tokyo',
    });
    expect(values.agenda?.agendaSummary).toBe('10:00 AM - 10:30 AM Opening Ceremony');
  });

  it('shows the time zone message and clears it when a zone is picked', async () => {
    const { form } = renderSection(<DatesSection />, { values: { timezone: '' } });
    act(() => form.current.setError('timezone', { type: 'manual', message: 'Time zone is required' }));

    expect(await screen.findByText('Time zone is required')).toBeInTheDocument();
    pickZone('UTC', /^UTC \(/);

    expect(form.current.getValues('timezone')).toBe('UTC');
    expect(screen.queryByText('Time zone is required')).not.toBeInTheDocument();
  });

  it('disables every control while a request runs', () => {
    renderSection(<DatesSection />, { busy: true });

    expect(screen.getByRole('button', { name: /^Start Date:/ })).toBeDisabled();
    expect(screen.getByLabelText('End time')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Time zone:/ })).toBeDisabled();
  });
});
