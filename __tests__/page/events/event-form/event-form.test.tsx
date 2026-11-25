import React, { createRef } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EventForm, type EventFormHandle, type EventFormProps } from '@/components/page/events/event-form/EventForm';
import { eventFormValues } from '@/components/page/events/event-form/EventForm.fixtures';
import type { EventFormValues } from '@/services/events/event-submission.types';

/* The assembled form: the old portal's order of sections, the Enter rule, the checks with their texts, one send. */

jest.unmock('@tanstack/react-query');
jest.mock('react-calendar', () => ({ __esModule: true, default: () => <div data-testid="calendar" /> }));
jest.mock('@/components/form/FormEditor', () => ({ FormEditor: () => <div data-testid="editor" /> }));

const scrollIntoView = jest.fn();
beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  // The next frame comes after the render that shows the messages, as in a browser.
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    setTimeout(() => callback(0), 0);
    return 0;
  });
});

function open(props: Partial<EventFormProps> & { values?: Partial<EventFormValues> } = {}) {
  const { values, ...rest } = props;
  const ref = createRef<EventFormHandle>();
  const onSend = jest.fn<Promise<void>, [EventFormValues, 'submit' | 'draft']>(async () => undefined);
  const onInvalid = jest.fn();
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <EventForm
        ref={ref}
        variant="submit"
        initialValues={eventFormValues(values)}
        onSend={onSend}
        onInvalid={onInvalid}
        renderActions={({ busy }) => <span data-testid="busy">{String(busy)}</span>}
        {...rest}
      />
    </QueryClientProvider>,
  );
  const sections = () =>
    Array.from(view.container.querySelectorAll('[data-section]')).map((node) => node.getAttribute('data-section'));
  const run = (mode: 'submit' | 'draft') => act(async () => ref.current?.run(mode));
  return { ...view, ref, onSend, onInvalid, sections, run };
}

const filled: Partial<EventFormValues> = {
  name: 'Lisbon Meetup',
  startDay: '2030-01-28',
  startTime: '09:00',
  endDay: '2030-01-28',
  endTime: '18:00',
  hostName: 'Protocol Labs',
};

beforeEach(() => scrollIntoView.mockClear());

describe('sections', () => {
  it('keeps the old portal’s order on the submit page', () => {
    const { sections } = open();
    expect(sections()).toHaveLength(8);
    const order = sections().join(' > ');
    expect(order).toMatch(/^access > registration.* > profile.* > format.* > dates.* > description.* > tags.* > host/);
    expect(screen.queryByText('Website Link')).toBeNull();
    expect(screen.queryByText('Social Handles')).toBeNull();
    expect(screen.queryByPlaceholderText('Enter your email')).toBeNull();
    expect(screen.queryByText(/Luma/)).toBeNull();
  });

  it('adds Website Link and Social Handles on the edit page', () => {
    const { sections } = open({ variant: 'edit' });
    expect(sections()).toHaveLength(10);
    expect(screen.getByText('Website Link')).toBeInTheDocument();
    expect(screen.getByText('Social Handles')).toBeInTheDocument();
  });

  it('starts with "Free/RSVP", "In Person" and the first tag', () => {
    open();
    expect(screen.getByRole('radio', { name: 'Free/RSVP' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'In Person' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByPlaceholderText('Enter Venue Location')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter Meeting Link')).toBeNull();
  });
});

describe('Enter', () => {
  it('submits nothing in a single-line field', async () => {
    const { onSend } = open({ values: filled });
    const host = screen.getByPlaceholderText('Enter Host Name');
    const notPrevented = fireEvent.keyDown(host, { key: 'Enter' });
    expect(notPrevented).toBe(false);
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe('Submit Event checks', () => {
  it('sends nothing, shows each message under its field and scrolls to the first', async () => {
    const { run, onSend, onInvalid } = open({ values: { tags: [] } });
    await run('submit');
    expect(onSend).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Event name required')).toBeInTheDocument();
    expect(screen.getByText('Start date and end date is required')).toBeInTheDocument();
    expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid host name')).toBeInTheDocument();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    const first = scrollIntoView.mock.instances[0] as HTMLElement;
    expect(first.closest('[data-section]')).toHaveTextContent('Event name required');
  });

  it('says "Time zone is required"', async () => {
    const { run } = open({ values: { ...filled, timezone: '' } });
    await run('submit');
    expect(screen.getByText('Time zone is required')).toBeInTheDocument();
  });

  it('says "Enter a valid registration link"', async () => {
    const { run, onSend } = open({ values: { ...filled, registrationUrl: 'not a link' } });
    await run('submit');
    expect(screen.getByText('Enter a valid registration link')).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('says "Co-host name is required" and "Enter a valid email" on the co-host row', async () => {
    const { run } = open({ values: { ...filled, coHosts: [{ name: '', email: 'nope' }] } });
    await run('submit');
    expect(screen.getByText('Co-host name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('says "Enter a valid website link" and "Please select a platform" on the edit page', async () => {
    const { run } = open({
      variant: 'edit',
      values: { ...filled, websiteUrl: 'not a link', socialHandles: [{ platform: '', handle: 'someone' }] },
    });
    await run('submit');
    expect(screen.getByText('Enter a valid website link')).toBeInTheDocument();
    expect(screen.getByText('Please select a platform')).toBeInTheDocument();
  });

  it('says the agenda session is outside the event', async () => {
    const agenda = {
      sessions: [{ name: 'Afterparty', start_date: '2030-01-29T20:00:00.000Z', end_date: '2030-01-29T22:00:00.000Z' }],
    };
    const { run, onSend } = open({ values: { ...filled, agenda, description: '<p>Hi</p>' } });
    await run('submit');
    expect(screen.getByText(/"Afterparty" is on Jan 29, but your event ends Jan 28/)).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends a valid form with no venue', async () => {
    const { run, onSend } = open({ values: filled });
    await run('submit');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0]).toEqual([expect.objectContaining({ name: 'Lisbon Meetup', venue: '' }), 'submit']);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Save as draft', () => {
  it('needs only the name, the dates and the time zone', async () => {
    const { run, onSend } = open({ values: { ...filled, hostName: '', tags: [] } });
    await run('draft');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0][1]).toBe('draft');
  });

  it('says "Event name required" with no name', async () => {
    const { run, onSend } = open({ values: { ...filled, name: '' } });
    await run('draft');
    expect(screen.getByText('Event name required')).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe('sending', () => {
  it('sends once for two presses, and is busy while the request runs', async () => {
    let finish: () => void = () => {};
    const onSend = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { ref } = open({ values: filled, onSend });
    await act(async () => {
      void ref.current?.run('submit');
      void ref.current?.run('submit');
    });
    expect(screen.getByTestId('busy')).toHaveTextContent('true');
    await act(async () => finish());
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('busy')).toHaveTextContent('false');
  });

  it('keeps everything typed when the send fails', async () => {
    const onSend = jest.fn(async () => undefined);
    const { ref, run } = open({ values: filled, onSend });
    await run('submit');
    expect(ref.current?.getValues()).toMatchObject(filled);
  });

  it('resets every field and its messages on reset', async () => {
    const { ref, run } = open();
    await run('submit');
    expect(screen.getByText('Event name required')).toBeInTheDocument();
    act(() => ref.current?.reset(eventFormValues(filled)));
    expect(screen.queryByText('Event name required')).toBeNull();
    expect(ref.current?.getValues().name).toBe('Lisbon Meetup');
  });
});
