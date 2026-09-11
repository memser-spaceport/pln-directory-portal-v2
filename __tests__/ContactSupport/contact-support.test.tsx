import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ContactSupport } from '@/components/ContactSupport/ContactSupport';
import { useContactSupportStore } from '@/services/contact-support/store';
import { toast } from '@/components/core/ToastContainer';

const mockMutate = jest.fn();
const mockSaveRegistrationImage = jest.fn();

jest.mock('@/components/ContactSupport/hooks/useContactSupport', () => ({
  useContactSupport: () => ({ mutate: mockMutate, isPending: false }),
}));

jest.mock('@/services/registration.service', () => ({
  saveRegistrationImage: (file: File) => mockSaveRegistrationImage(file),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/form/FormEditor', () => ({
  FormEditor: ({
    name,
    label,
    placeholder,
    toolbarConfig,
    simplified,
  }: {
    name: string;
    label?: string;
    placeholder: string;
    toolbarConfig?: unknown;
    simplified?: boolean;
  }) => {
    const { useFormContext } = require('react-hook-form');
    const { setValue, watch } = useFormContext();
    return (
      <textarea
        aria-label="support-message"
        data-field-label={label}
        data-simplified={String(simplified)}
        data-toolbar={JSON.stringify(toolbarConfig)}
        placeholder={placeholder}
        value={watch(name) ?? ''}
        onChange={(e) => setValue(name, e.target.value, { shouldValidate: true, shouldDirty: true })}
      />
    );
  },
}));

const userInfo = { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' };

/** The modal title is a plain div, and every topic name is also a pill button —
 *  so the selector is what tells the two apart. */
const modalTitle = () => screen.getByText(/^(Contact support|Ask a question|Give feedback|Share an idea|Report a bug)$/, {
  selector: 'div',
});

describe('ContactSupport', () => {
  beforeEach(() => {
    mockSaveRegistrationImage.mockResolvedValue({ image: { url: 'https://cdn.test/hosted.png' } });
    useContactSupportStore.getState().actions.openModal();
  });

  afterEach(() => {
    jest.clearAllMocks();
    useContactSupportStore.getState().actions.closeModal();
  });

  it('uses a rich-text editor with headings, links, and images', () => {
    render(<ContactSupport userInfo={userInfo} />);

    const editor = screen.getByLabelText('support-message');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-simplified', 'true');
    expect(editor.getAttribute('data-toolbar')).toContain('image');
    expect(editor.getAttribute('data-toolbar')).toContain('link');
    expect(editor.getAttribute('data-toolbar')).toContain('header');
  });

  it('submits HTML from a prefilled logged-in user', async () => {
    render(<ContactSupport userInfo={userInfo} />);

    fireEvent.change(screen.getByLabelText('support-message'), {
      target: { value: '<h2>Search is broken</h2><p>See screenshot</p>' },
    });

    const submit = screen.getByRole('button', { name: 'Submit' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          message: '<h2>Search is broken</h2><p>See screenshot</p>',
        }),
        expect.any(Object),
      ),
    );
  });

  it('submits HTML from the editor', async () => {
    render(<ContactSupport />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('support-message'), {
      target: { value: '<p><strong>Broken search</strong></p>' },
    });

    const submit = screen.getByRole('button', { name: 'Submit' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Contact support',
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          message: '<p><strong>Broken search</strong></p>',
        }),
        expect.any(Object),
      ),
    );
  });

  it('uploads pasted data-URI images before submitting', async () => {
    render(<ContactSupport />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('support-message'), {
      target: { value: '<p><img src="data:image/png;base64,AAAA"></p>' },
    });

    const submit = screen.getByRole('button', { name: 'Submit' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '<p><img src="https://cdn.test/hosted.png"></p>',
        }),
        expect.any(Object),
      ),
    );
    expect(mockSaveRegistrationImage).toHaveBeenCalledTimes(1);
  });

  it('does not submit empty Quill markup', async () => {
    render(<ContactSupport />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('support-message'), {
      target: { value: '<p><br></p>' },
    });

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not submit when a pasted image fails to upload', async () => {
    mockSaveRegistrationImage.mockRejectedValue(new Error('upload failed'));
    render(<ContactSupport />);

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('support-message'), {
      target: { value: '<p><img src="data:image/png;base64,AAAA"></p>' },
    });

    const submit = screen.getByRole('button', { name: 'Submit' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Image upload failed. Please try again.'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  describe('topic pills', () => {
    it('puts every topic on screen at rest, rather than behind a press', () => {
      render(<ContactSupport userInfo={userInfo} />);

      expect(screen.getAllByRole('radio')).toHaveLength(5);
      for (const label of ['Contact support', 'Ask a question', 'Give feedback', 'Share an idea', 'Report a bug']) {
        expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
      }
      expect(screen.getByRole('radio', { name: 'Contact support' })).toBeChecked();
    });

    it('moves the title and the field label onto the chosen topic', () => {
      render(<ContactSupport userInfo={userInfo} />);

      expect(modalTitle()).toHaveTextContent('Contact support');
      expect(screen.getByLabelText('support-message')).toHaveAttribute('data-field-label', 'Describe the issue');

      fireEvent.click(screen.getByRole('radio', { name: 'Give feedback' }));

      expect(modalTitle()).toHaveTextContent('Give feedback');
      expect(screen.getByRole('radio', { name: 'Give feedback' })).toBeChecked();
      expect(screen.getByLabelText('support-message')).toHaveAttribute('data-field-label', 'Your feedback');
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    });

    // The store's topic is what ContactSupportUrlSync turns into `?dialog=`.
    // A pill that only set form state would leave the URL pointing at whatever
    // topic the modal was opened on.
    it('tells the store, so the deep link keeps up', () => {
      render(<ContactSupport userInfo={userInfo} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Report a bug' }));

      expect(useContactSupportStore.getState().topic).toBe('Report a bug');
    });

    // The row is one tab stop, so Tab cannot reach the other four and arrow
    // keys have to.
    it('lets the arrow keys reach the topics Tab no longer can', () => {
      render(<ContactSupport userInfo={userInfo} />);

      const first = screen.getByRole('radio', { name: 'Contact support' });
      expect(first).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('radio', { name: 'Ask a question' })).toHaveAttribute('tabindex', '-1');

      fireEvent.keyDown(first, { key: 'ArrowRight' });
      expect(screen.getByRole('radio', { name: 'Ask a question' })).toBeChecked();

      fireEvent.keyDown(screen.getByRole('radio', { name: 'Ask a question' }), { key: 'ArrowLeft' });
      expect(screen.getByRole('radio', { name: 'Contact support' })).toBeChecked();

      // Wrapping backwards off the first pill lands on the last.
      fireEvent.keyDown(screen.getByRole('radio', { name: 'Contact support' }), { key: 'ArrowUp' });
      expect(screen.getByRole('radio', { name: 'Report a bug' })).toBeChecked();
    });

    it('submits the topic the pill selected', async () => {
      render(<ContactSupport userInfo={userInfo} />);

      fireEvent.click(screen.getByRole('radio', { name: 'Share an idea' }));
      fireEvent.change(screen.getByLabelText('support-message'), {
        target: { value: '<p>A directory for octopuses</p>' },
      });

      const submit = screen.getByRole('button', { name: 'Submit' });
      await waitFor(() => expect(submit).toBeEnabled());
      fireEvent.click(submit);

      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({ topic: 'Share an idea' }),
          expect.any(Object),
        ),
      );
    });
  });
});
