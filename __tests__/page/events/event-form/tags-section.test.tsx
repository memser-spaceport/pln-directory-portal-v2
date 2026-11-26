import '@testing-library/jest-dom';
import { act, fireEvent, screen } from '@testing-library/react';

import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { TagsSection } from '@/components/page/events/event-form/TagsSection';

/* The default tag chips and the custom tags, against the form's `tags`. */

const chip = (name: string) => screen.getByRole('button', { name });

function typeTag(text: string) {
  const input = screen.getByPlaceholderText('Type your tag here');
  fireEvent.change(input, { target: { value: text } });
  return fireEvent.keyDown(input, { key: 'Enter' });
}

describe('TagsSection', () => {
  it('shows the default chips with "Talks & Presentation" selected on a new form', () => {
    renderSection(<TagsSection />);

    expect(screen.getByText('Choose Event tag(s)')).toBeInTheDocument();
    expect(chip('Talks & Presentation')).toHaveAttribute('aria-pressed', 'true');
    ['Hackathon', 'Workshop', 'Art Exhibition', 'Social Event'].forEach((name) =>
      expect(chip(name)).toHaveAttribute('aria-pressed', 'false'),
    );
  });

  it('switches a chip on and off', () => {
    const { form } = renderSection(<TagsSection />);

    fireEvent.click(chip('Workshop'));
    expect(form.current.getValues('tags')).toEqual(['Talks & Presentation', 'Workshop']);

    fireEvent.click(chip('Workshop'));
    expect(form.current.getValues('tags')).toEqual(['Talks & Presentation']);
  });

  it('adds a trimmed custom tag on Enter without letting Enter through', () => {
    const { form } = renderSection(<TagsSection />);

    const notPrevented = typeTag('  Demo Day ');

    expect(notPrevented).toBe(false);
    expect(form.current.getValues('tags')).toEqual(['Talks & Presentation', 'Demo Day']);
    expect(screen.getByRole('button', { name: 'Remove tag Demo Day' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your tag here')).toHaveValue('');
  });

  it('ignores a custom tag that already exists, whatever its case', () => {
    const { form } = renderSection(<TagsSection />, { values: { tags: ['Talks & Presentation', 'Demo Day'] } });

    typeTag('demo day');
    typeTag('TALKS & PRESENTATION');
    typeTag('   ');

    expect(form.current.getValues('tags')).toEqual(['Talks & Presentation', 'Demo Day']);
  });

  it('switches the default chip on when its name is typed', () => {
    const { form } = renderSection(<TagsSection />);

    typeTag('hackathon');

    expect(form.current.getValues('tags')).toEqual(['Talks & Presentation', 'Hackathon']);
    expect(chip('Hackathon')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /^Remove tag/ })).not.toBeInTheDocument();
  });

  it('leaves `tags` empty when every tag is removed', () => {
    const { form } = renderSection(<TagsSection />, { values: { tags: ['Talks & Presentation', 'Demo Day'] } });

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag Demo Day' }));
    fireEvent.click(chip('Talks & Presentation'));

    expect(form.current.getValues('tags')).toEqual([]);
  });

  it('shows the tags message and clears it when a tag changes', async () => {
    const { form } = renderSection(<TagsSection />, { values: { tags: [] } });
    act(() => form.current.setError('tags', { type: 'manual', message: 'At least one tag is required' }));

    expect(await screen.findByText('At least one tag is required')).toBeInTheDocument();
    fireEvent.click(chip('Hackathon'));

    expect(screen.queryByText('At least one tag is required')).not.toBeInTheDocument();
  });
});
