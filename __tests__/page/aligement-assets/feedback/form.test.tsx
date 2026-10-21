import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FeedbackForm from '@/components/page/aligement-assets/feedback/feedback-form';
import { FeedbackApiError } from '@/services/plaa/feedback/feedback.types';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngFile(name = 'shot.png', size = 1024) {
  const file = new File([PNG_BYTES], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function renderForm(props: Partial<React.ComponentProps<typeof FeedbackForm>> = {}) {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(<FeedbackForm onClose={onClose} onSubmit={onSubmit} isSubmitting={false} {...props} />);
  return { onSubmit, onClose };
}

const typeButton = (label: RegExp) => screen.getByRole('button', { name: label });
const submitButton = () => screen.getByRole('button', { name: /^Submit$/ });

function fillValid() {
  fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A good clear title' } });
  fireEvent.change(screen.getByLabelText(/Describe the new feature/), {
    target: { value: 'This description is comfortably longer than twenty characters.' },
  });
}

describe('AC-T5.1 modal behaviour', () => {
  it('opens with focus on the type selector', () => {
    renderForm();
    expect(typeButton(/New feature/)).toHaveFocus();
  });

  it('closes on Escape when nothing has been typed', () => {
    const { onClose } = renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks before discarding unsaved text', () => {
    const { onClose } = renderForm();
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'half an idea' } });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the draft when the discard prompt is dismissed', () => {
    const { onClose } = renderForm();
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'half an idea' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Title$/)).toHaveValue('half an idea');
  });
});

describe('AC-T5.2 required fields', () => {
  it('blocks submit until title and description pass', () => {
    const { onSubmit } = renderForm();
    expect(submitButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A good clear title' } });
    expect(submitButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Describe the new feature/), { target: { value: 'too short' } });
    expect(submitButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Describe the new feature/), {
      target: { value: 'This description is comfortably longer than twenty characters.' },
    });
    expect(submitButton()).toBeEnabled();

    fireEvent.click(submitButton());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects a title under 5 characters', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/Describe the new feature/), {
      target: { value: 'This description is comfortably longer than twenty characters.' },
    });
    expect(submitButton()).toBeDisabled();
  });
});

describe('AC-T5.3 bug variant', () => {
  it('swaps the description label and shows the privacy note', () => {
    renderForm();
    expect(screen.queryByTestId('fb-bug-privacy-note')).not.toBeInTheDocument();

    fireEvent.click(typeButton(/^Bug$/));

    expect(screen.getByLabelText(/What happened, and what did you expect/)).toBeInTheDocument();
    expect(screen.getByTestId('fb-bug-privacy-note')).toBeInTheDocument();
  });

  it('sends source_path only for bugs', () => {
    const { onSubmit } = renderForm({ sourcePath: '/alignment-asset/activities' });

    fillValid();
    fireEvent.click(submitButton());
    expect(onSubmit.mock.calls[0][0].source_path).toBeUndefined();

    fireEvent.click(typeButton(/^Bug$/));
    fireEvent.click(submitButton());
    expect(onSubmit.mock.calls[1][0].source_path).toBe('/alignment-asset/activities');
  });

  it('marks the type on the submitted values', () => {
    const { onSubmit } = renderForm();
    fireEvent.click(typeButton(/^Improvement$/));
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A good clear title' } });
    fireEvent.change(screen.getByLabelText(/What should change, and where/), {
      target: { value: 'This description is comfortably longer than twenty characters.' },
    });
    fireEvent.click(submitButton());
    expect(onSubmit.mock.calls[0][0].type).toBe('improvement');
  });
});

describe('AC-T5.4 screenshot rules', () => {
  const fileInput = () => screen.getByLabelText(/Screenshot/) as HTMLInputElement;

  it('rejects a file over 5 MB and attaches nothing', async () => {
    renderForm();
    fireEvent.change(fileInput(), { target: { files: [pngFile('huge.png', 6 * 1024 * 1024)] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/larger than 5 MB/);
    expect(screen.queryByText('huge.png')).not.toBeInTheDocument();
  });

  it('rejects a type that is not PNG, JPG, or WebP', async () => {
    renderForm();
    const gif = new File([PNG_BYTES], 'animation.gif', { type: 'image/gif' });
    fireEvent.change(fileInput(), { target: { files: [gif] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/isn't a PNG, JPG, or WebP/);
  });

  it('rejects a fourth file', async () => {
    renderForm();
    fireEvent.change(fileInput(), {
      target: { files: [pngFile('a.png'), pngFile('b.png'), pngFile('c.png'), pngFile('d.png')] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/up to 3 screenshots/);
  });

  it('attaches up to three valid files and allows removing one', async () => {
    renderForm();
    fireEvent.change(fileInput(), { target: { files: [pngFile('a.png'), pngFile('b.png')] } });

    await waitFor(() => expect(screen.getByText('a.png')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(screen.queryByText('a.png')).not.toBeInTheDocument();
    expect(screen.getByText('b.png')).toBeInTheDocument();
  });
});

describe('AC-T5.6 link validation', () => {
  it('rejects a link that is not https', () => {
    renderForm();
    fillValid();
    fireEvent.change(screen.getByLabelText(/^Link/), { target: { value: 'http://example.com' } });
    expect(submitButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Link/), { target: { value: 'https://example.com' } });
    expect(submitButton()).toBeEnabled();
  });

  it('rejects a javascript: link', () => {
    renderForm();
    fillValid();
    // eslint-disable-next-line no-script-url
    fireEvent.change(screen.getByLabelText(/^Link/), { target: { value: 'javascript:alert(1)' } });
    expect(submitButton()).toBeDisabled();
  });
});

describe('AC-T5.C compliance', () => {
  it('renders the posting guidelines marked pending Legal review', () => {
    const { container } = render(
      <FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />,
    );
    const guidelines = container.querySelector('[data-pending-legal-review="true"]');
    expect(guidelines).toBeInTheDocument();
    expect(guidelines).toHaveTextContent(/visible to PLAA members/i);
    expect(guidelines).toHaveTextContent(/only to you and the PLAA team/i);
  });

  it('uses no banned vocabulary anywhere in the form', () => {
    const { container } = render(
      <FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />,
    );
    // PLAA guardrail: points are "collected", never the banned verb.
    expect(container.textContent).not.toMatch(/\be[a]rn(s|ed|ing)?\b/i);
  });
});

describe('error surfaces', () => {
  it('explains a rate limit rather than showing a generic failure', () => {
    renderForm({ submitError: new FeedbackApiError('nope', 429) });
    expect(screen.getByText(/today's submission limit/i)).toBeInTheDocument();
  });

  it('shows a generic message for any other failure', () => {
    renderForm({ submitError: new FeedbackApiError('boom', 500) });
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });
});
