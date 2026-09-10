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
    placeholder,
    toolbarConfig,
    simplified,
  }: {
    name: string;
    placeholder: string;
    toolbarConfig?: unknown;
    simplified?: boolean;
  }) => {
    const { useFormContext } = require('react-hook-form');
    const { setValue, watch } = useFormContext();
    return (
      <textarea
        aria-label="support-message"
        data-simplified={String(simplified)}
        data-toolbar={JSON.stringify(toolbarConfig)}
        placeholder={placeholder}
        value={watch(name) ?? ''}
        onChange={(e) => setValue(name, e.target.value, { shouldValidate: true, shouldDirty: true })}
      />
    );
  },
}));

jest.mock('@/components/form/Dropdown', () => ({
  Dropdown: ({
    label,
    options,
    onItemSelect,
    selectedOption,
  }: {
    label: string;
    options: Array<{ label: string; value: string }>;
    onItemSelect: (option: { label: string; value: string } | null) => void;
    selectedOption?: { label: string; value: string };
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={selectedOption?.value ?? ''}
        onChange={(e) => onItemSelect(options.find((opt) => opt.value === e.target.value) ?? null)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

const userInfo = { uid: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' };

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
});
