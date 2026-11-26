import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { ProfileSection } from '@/components/page/events/event-form/ProfileSection';
import { readImageSize } from '@/components/page/events/event-form/readImageSize';

/*
 * The logo tile and the event name. The image's size is read by a mocked `readImageSize`, since jsdom decodes no
 * images.
 */

jest.mock('@/components/page/events/event-form/readImageSize', () => ({ readImageSize: jest.fn() }));

const sizeOf = readImageSize as jest.MockedFunction<typeof readImageSize>;

const MB = 1024 * 1024;

function imageFile(name: string, bytes = 1024, type = 'image/png'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

function pick(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

const stored = { kind: 'stored' as const, uid: 'logo-1', url: 'https://files.example/logo-1.png' };

beforeEach(() => {
  sizeOf.mockReset();
  sizeOf.mockResolvedValue({ width: 512, height: 512 });
  let n = 0;
  URL.createObjectURL = jest.fn(() => `blob:preview-${++n}`);
  URL.revokeObjectURL = jest.fn();
});

describe('ProfileSection: logo', () => {
  it('says what a logo must be before anything is picked', () => {
    renderSection(<ProfileSection />);

    expect(screen.getByText('Logo: a square (1:1) PNG or JPEG, up to 4MB')).toBeInTheDocument();
  });

  it('offers an upload control and no picture while there is no logo', () => {
    renderSection(<ProfileSection />);

    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Event logo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete logo' })).not.toBeInTheDocument();
  });

  it('attaches a square PNG and shows it with replace and delete', async () => {
    const { container, form } = renderSection(<ProfileSection />);
    const file = imageFile('logo.png');

    pick(container, file);

    expect(await screen.findByRole('img', { name: 'Event logo' })).toHaveAttribute('src', 'blob:preview-1');
    const logo = form.current.getValues('logo');
    expect(logo?.kind === 'file' && logo.file).toBe(file);
    expect(logo?.kind === 'file' && logo.previewUrl).toBe('blob:preview-1');
    expect(screen.getByRole('button', { name: 'Replace logo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete logo' })).toBeInTheDocument();
  });

  it('accepts a width and height that differ by 10 px', async () => {
    sizeOf.mockResolvedValue({ width: 510, height: 500 });
    const { container, form } = renderSection(<ProfileSection />);

    pick(container, imageFile('almost-square.jpg', 1024, 'image/jpeg'));

    await waitFor(() => expect(form.current.getValues('logo')).not.toBeNull());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refuses a 6 MB file and sets no logo', async () => {
    const { container, form } = renderSection(<ProfileSection />);

    pick(container, imageFile('big.png', 6 * MB));

    expect(await screen.findByText('Image size should be less than 4MB')).toBeInTheDocument();
    expect(form.current.getValues('logo')).toBeNull();
    expect(sizeOf).not.toHaveBeenCalled();
  });

  it('refuses a 1200x600 file and keeps the earlier logo', async () => {
    sizeOf.mockResolvedValue({ width: 1200, height: 600 });
    const { container, form } = renderSection(<ProfileSection />, { values: { logo: stored } });

    pick(container, imageFile('wide.png'));

    expect(await screen.findByText('Image must have a 1:1 aspect ratio')).toBeInTheDocument();
    expect(form.current.getValues('logo')).toEqual(stored);
    expect(screen.getByRole('img', { name: 'Event logo' })).toHaveAttribute('src', stored.url);
  });

  it('ignores a file that is not a PNG or JPEG', async () => {
    const { container, form } = renderSection(<ProfileSection />);

    pick(container, imageFile('anim.gif', 1024, 'image/gif'));

    await waitFor(() => expect(sizeOf).not.toHaveBeenCalled());
    expect(form.current.getValues('logo')).toBeNull();
  });

  it('replaces the logo, and a good file clears the earlier message', async () => {
    const { container, form } = renderSection(<ProfileSection />, { values: { logo: stored } });

    pick(container, imageFile('big.png', 6 * MB));
    expect(await screen.findByText('Image size should be less than 4MB')).toBeInTheDocument();

    const next = imageFile('next.png');
    pick(container, next);

    await waitFor(() => expect(form.current.getValues('logo')?.kind).toBe('file'));
    const logo = form.current.getValues('logo');
    expect(logo?.kind === 'file' && logo.file).toBe(next);
    expect(screen.queryByText('Image size should be less than 4MB')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Event logo' })).toHaveAttribute('src', 'blob:preview-1');
  });

  it('deletes the logo', async () => {
    const { container, form } = renderSection(<ProfileSection />);
    pick(container, imageFile('logo.png'));
    await screen.findByRole('img', { name: 'Event logo' });

    fireEvent.click(screen.getByRole('button', { name: 'Delete logo' }));

    expect(form.current.getValues('logo')).toBeNull();
    expect(screen.queryByRole('img', { name: 'Event logo' })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(screen.getByRole('button', { name: 'Upload logo' })).toBeInTheDocument();
  });

  it('disables the controls while the form is busy', () => {
    renderSection(<ProfileSection />, { values: { logo: stored }, busy: true });

    expect(screen.getByRole('button', { name: 'Replace logo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete logo' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Event Name' })).toBeDisabled();
  });
});

describe('ProfileSection: name', () => {
  it('has the placeholder and holds what is typed', () => {
    const { form } = renderSection(<ProfileSection />);
    const input = screen.getByRole('textbox', { name: 'Event Name' });

    expect(input).toHaveAttribute('placeholder', 'Enter Event Name');
    fireEvent.change(input, { target: { value: 'Lab Week' } });

    expect(form.current.getValues('name')).toBe('Lab Week');
    expect(input).toHaveValue('Lab Week');
  });

  it('cuts a 150-character name to the first 100', () => {
    const { form } = renderSection(<ProfileSection />);
    const input = screen.getByRole('textbox', { name: 'Event Name' });
    const long = 'a'.repeat(99) + 'b' + 'c'.repeat(50);

    fireEvent.change(input, { target: { value: long } });

    expect(form.current.getValues('name')).toBe('a'.repeat(99) + 'b');
    expect(input).toHaveValue('a'.repeat(99) + 'b');
  });

  it('takes at most 100 characters and shows how many are used', () => {
    renderSection(<ProfileSection />, { values: { name: 'Lab Week' } });

    expect(screen.getByRole('textbox', { name: 'Event Name' })).toHaveAttribute('maxLength', '100');
    expect(screen.getByText('8 / 100')).toBeInTheDocument();
  });

  it("shows the name's message and clears it on a change", async () => {
    const { form } = renderSection(<ProfileSection />);
    form.current.setError('name', { type: 'manual', message: 'Event name required' });

    expect(await screen.findByText('Event name required')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Event Name' }), { target: { value: 'L' } });

    await waitFor(() => expect(screen.queryByText('Event name required')).not.toBeInTheDocument());
  });
});
