import '@testing-library/jest-dom';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';

import { DescriptionSection } from '@/components/page/events/event-form/DescriptionSection';
import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { EventRequestError, parseAgenda } from '@/services/events/event-submission.service';
import type { EventBodyAgenda } from '@/services/events/event-submission.types';

/*
 * The description and the agenda. The rich text editor is a plain text area bound to the same form field, and the
 * agenda parser is mocked.
 */

jest.mock('@/services/events/event-submission.service', () => ({
  ...jest.requireActual('@/services/events/event-submission.service'),
  parseAgenda: jest.fn(),
}));

jest.mock('@/components/form/FormEditor', () => ({
  FormEditor: function FormEditorStub({ name, placeholder }: { name: string; placeholder: string }) {
    const { watch, setValue } = useFormContext();
    return (
      <textarea
        aria-label="Description"
        placeholder={placeholder}
        value={watch(name) ?? ''}
        onChange={(event) => setValue(name, event.target.value)}
      />
    );
  },
}));

const parse = parseAgenda as jest.MockedFunction<typeof parseAgenda>;

const AGENDA_PLACEHOLDER = 'Paste or Type Date, Time, Title and Description of the Agenda';
const TEXT = '10:00 AM - 10:30 AM Opening Ceremony';

const session = {
  name: 'Opening Ceremony',
  description: 'Welcome note and event kickoff',
  start_date: '2026-01-28T10:00:00.000Z',
  end_date: '2026-01-28T10:30:00.000Z',
  timezone: 'Europe/Lisbon',
};
const agenda: EventBodyAgenda = { sessions: [session], agendaSummary: TEXT };
const dates = { startDay: '2026-01-28', startTime: '09:00', endDay: '2026-01-28', endTime: '18:00' };

/** Opens the editor and the agenda box, and types the agenda text. */
function openBoxWith(text: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Add Description' }));
  fireEvent.click(screen.getByRole('button', { name: 'Type /Agenda to Add Agenda' }));
  fireEvent.change(screen.getByPlaceholderText(AGENDA_PLACEHOLDER), { target: { value: text } });
}

beforeEach(() => parse.mockReset());

describe('DescriptionSection: description', () => {
  it('is closed at first and opens with "Add Description"', () => {
    renderSection(<DescriptionSection />);

    expect(screen.queryByPlaceholderText('Enter description')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Description' }));

    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    expect(screen.getByText('Type /Agenda to Add Agenda')).toBeInTheDocument();
  });

  it('is open already when the form has a description or an agenda', () => {
    const withText = renderSection(<DescriptionSection />, { values: { description: '<p>Hello</p>' } });
    expect(screen.getByPlaceholderText('Enter description')).toHaveValue('<p>Hello</p>');
    withText.unmount();

    renderSection(<DescriptionSection />, { values: { ...dates, agenda } });
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('opens the agenda box and removes the command when "/Agenda" is typed', async () => {
    const { form } = renderSection(<DescriptionSection />, { values: { description: '<p>Notes</p>' } });

    fireEvent.change(screen.getByPlaceholderText('Enter description'), {
      target: { value: '<p>Notes /Agenda</p>' },
    });

    expect(await screen.findByPlaceholderText(AGENDA_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Agenda' })).toBeInTheDocument();
    expect(screen.getByText('Agenda Format')).toBeInTheDocument();
    expect(form.current.getValues('description')).toBe('<p>Notes </p>');
  });

  it('leaves an address that ends in /agenda alone', () => {
    const html = '<p><a href="https://example.com/agenda">example.com/agenda</a></p>';
    const { form } = renderSection(<DescriptionSection />, { values: { description: '<p>Notes</p>' } });

    fireEvent.change(screen.getByPlaceholderText('Enter description'), { target: { value: html } });

    expect(screen.queryByPlaceholderText(AGENDA_PLACEHOLDER)).not.toBeInTheDocument();
    expect(form.current.getValues('description')).toBe(html);
  });
});

describe('DescriptionSection: agenda box', () => {
  it('stores the parsed sessions and shows them by day', async () => {
    parse.mockResolvedValue({ sessions: [session], message: null });
    const { form } = renderSection(<DescriptionSection />, { values: dates });

    openBoxWith(TEXT);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM – 10:30 AM • Opening Ceremony')).toBeInTheDocument();
    expect(screen.getByText('Welcome note and event kickoff')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(AGENDA_PLACEHOLDER)).not.toBeInTheDocument();
    expect(parse).toHaveBeenCalledWith({
      text: TEXT,
      startDate: '2026-01-28T09:00:00.000Z',
      endDate: '2026-01-28T18:00:00.000Z',
      timezone: 'Europe/Lisbon',
    });
    expect(form.current.getValues('agenda')).toEqual({ sessions: [session], agendaSummary: TEXT });
  });

  it('asks for the dates first and does not call the parser', () => {
    renderSection(<DescriptionSection />);

    openBoxWith(TEXT);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Please select start and end date before adding agenda items.')).toBeInTheDocument();
    expect(parse).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(AGENDA_PLACEHOLDER)).toHaveValue(TEXT);
  });

  it("shows the parser's message and keeps the text when it finds no times", async () => {
    parse.mockResolvedValue({ sessions: [], message: 'Add a start time to "Opening Ceremony".' });
    const { form } = renderSection(<DescriptionSection />, { values: dates });

    openBoxWith('Opening Ceremony');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Add a start time to "Opening Ceremony".')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(AGENDA_PLACEHOLDER)).toHaveValue('Opening Ceremony');
    expect(form.current.getValues('agenda')).toBeNull();
  });

  it('says that times are missing when the parser gives no message', async () => {
    parse.mockResolvedValue({ sessions: [], message: null });
    renderSection(<DescriptionSection />, { values: dates });

    openBoxWith('Opening Ceremony');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText('Could not find agenda times in this text. Add a time to each item.'),
    ).toBeInTheDocument();
  });

  it('shows the failure message and keeps the text when the parser fails', async () => {
    parse.mockRejectedValue(new EventRequestError(502, 'Failed to read the agenda'));
    renderSection(<DescriptionSection />, { values: dates });

    openBoxWith(TEXT);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Could not read the agenda. Please try again.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(AGENDA_PLACEHOLDER)).toHaveValue(TEXT);
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('disables "Add" while the request runs and with no text', async () => {
    let finish: (value: { sessions: (typeof session)[]; message: null }) => void = () => {};
    parse.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderSection(<DescriptionSection />, { values: dates });

    openBoxWith('');
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(AGENDA_PLACEHOLDER), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    finish({ sessions: [session], message: null });
    expect(await screen.findByText('Day 1')).toBeInTheDocument();
  });

  it('starts with the stored agenda text and drops the edit on "Cancel"', () => {
    const { form } = renderSection(<DescriptionSection />, { values: { ...dates, agenda } });

    fireEvent.click(screen.getByRole('button', { name: 'Add/Edit' }));
    const text = screen.getByPlaceholderText(AGENDA_PLACEHOLDER);
    expect(text).toHaveValue(TEXT);
    fireEvent.change(text, { target: { value: 'Something else' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByPlaceholderText(AGENDA_PLACEHOLDER)).not.toBeInTheDocument();
    expect(form.current.getValues('agenda')).toEqual(agenda);
  });
});

describe('DescriptionSection: agenda', () => {
  it('asks before "Remove all" and removes on confirm', async () => {
    const { form } = renderSection(<DescriptionSection />, { values: { ...dates, agenda } });

    fireEvent.click(screen.getByRole('button', { name: 'Remove all' }));
    expect(await screen.findByText('Remove All Agenda Items?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(screen.queryByText('Day 1')).not.toBeInTheDocument());
    expect(form.current.getValues('agenda')).toBeNull();
    expect(screen.queryByText('Remove All Agenda Items?')).not.toBeInTheDocument();
  });

  it('keeps the agenda on "Cancel"', async () => {
    const { form } = renderSection(<DescriptionSection />, { values: { ...dates, agenda } });

    fireEvent.click(screen.getByRole('button', { name: 'Remove all' }));
    expect(await screen.findByText('Remove All Agenda Items?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Remove All Agenda Items?')).not.toBeInTheDocument();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(form.current.getValues('agenda')).toEqual(agenda);
  });

  it('shows the agenda message under the agenda', async () => {
    const { form } = renderSection(<DescriptionSection />, { values: { ...dates, agenda } });
    act(() =>
      form.current.setError('agenda', { type: 'manual', message: '"Opening Ceremony" is on Jan 29. Check the date.' }),
    );

    expect(await screen.findByText('"Opening Ceremony" is on Jan 29. Check the date.')).toBeInTheDocument();
  });
});
