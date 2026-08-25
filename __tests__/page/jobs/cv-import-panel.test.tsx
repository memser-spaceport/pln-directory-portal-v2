import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ExperienceImportPanel } from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';
import type { ParsedProfile } from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';

/**
 * The panel's whole job is deciding what to say about a read that didn't produce
 * a review — and the two ways that happens mean different things to the person
 * holding the file.
 */

const parsedWith = (count: number): ParsedProfile => ({
  importUid: 'import-1',
  role: 'Senior Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Rust'],
  experiences: Array.from({ length: count }, (_, i) => ({
    key: `parsed-${i}`,
    title: 'Protocol Engineer',
    company: 'Lattice Compute',
    description: '',
    startDate: '2021-03',
    endDate: null,
    isCurrent: true,
    location: 'Berlin, Germany',
  })),
});

const file = (name = 'cv.pdf', sizeMb = 1) => {
  const f = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(f, 'size', { value: sizeMb * 1024 * 1024 });
  return f;
};

const drop = (f: File) => {
  // The drop area is the only labelled thing in the box; its Upload button opens
  // the OS dialog, which jsdom cannot. Dropping is the same code path.
  const box = screen.getByText('Drag & drop your CV').closest('div')!.parentElement!;
  fireEvent.drop(box, { dataTransfer: { files: [f] } });
};

const renderPanel = (props: Partial<React.ComponentProps<typeof ExperienceImportPanel>> = {}) =>
  render(
    <ExperienceImportPanel
      entry="direct"
      onParse={jest.fn().mockResolvedValue(parsedWith(2))}
      onAbort={jest.fn()}
      onParsed={jest.fn()}
      onAddManually={jest.fn()}
      {...props}
    />,
  );

describe('ExperienceImportPanel', () => {
  it('rejects an oversized file without making a request', async () => {
    const onParse = jest.fn();
    renderPanel({ onParse });

    drop(file('huge.pdf', 6));

    expect(await screen.findByText(/file size must be less than 5MB/i)).toBeInTheDocument();
    expect(onParse).not.toHaveBeenCalled();
  });

  /**
   * PDF only, and the dropzone has to say so before the request rather than
   * after: the upload endpoint checks the mime type and that the bytes begin
   * `%PDF`, so a DOCX would be accepted here and refused there — a round trip
   * spent to deliver a rejection the sentence above the box could have avoided.
   */
  it.each([['notes.txt'], ['cv.docx'], ['cv.doc']])('rejects %s without making a request', async (name) => {
    const onParse = jest.fn();
    renderPanel({ onParse });

    drop(file(name));

    expect(await screen.findByText(/file format must be one of: PDF/i)).toBeInTheDocument();
    expect(onParse).not.toHaveBeenCalled();
  });

  it('shows the file it is reading, and hands the result up', async () => {
    const onParsed = jest.fn();
    let resolve!: (p: ParsedProfile) => void;
    const onParse = jest.fn(() => new Promise<ParsedProfile>((r) => (resolve = r)));

    renderPanel({ onParse, onParsed });
    drop(file('polina-cv.pdf'));

    expect(await screen.findByText(/reading polina-cv\.pdf/i)).toBeInTheDocument();

    await act(async () => resolve(parsedWith(3)));

    await waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1));
    expect(onParsed.mock.calls[0][0].experiences).toHaveLength(3);
  });

  it('says the document had nothing in it when the parse resolves empty', async () => {
    renderPanel({ onParse: jest.fn().mockResolvedValue(parsedWith(0)) });

    drop(file());

    expect(await screen.findByText(/couldn’t find any roles in that file/i)).toBeInTheDocument();
    expect(screen.getByText(/try another file/i)).toBeInTheDocument();
  });

  it('says something different when the read fails — a dead server is not a bad CV', async () => {
    renderPanel({ onParse: jest.fn().mockRejectedValue(new Error('boom')) });

    drop(file());

    expect(await screen.findByText(/couldn’t read that file just now/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    // The claim about the document must NOT be made.
    expect(screen.queryByText(/couldn’t find any roles/i)).not.toBeInTheDocument();
  });

  it('Cancel during a read aborts it, and a late result is ignored', async () => {
    const onAbort = jest.fn();
    const onParsed = jest.fn();
    const onCancelRead = jest.fn();
    let resolve!: (p: ParsedProfile) => void;
    const onParse = jest.fn(() => new Promise<ParsedProfile>((r) => (resolve = r)));

    renderPanel({ onParse, onAbort, onParsed, onCancelRead });
    drop(file());

    fireEvent.click(await screen.findByRole('button', { name: /cancel/i }));

    expect(onAbort).toHaveBeenCalled();
    expect(onCancelRead).toHaveBeenCalledTimes(1);

    // The request was already in flight; its resolution must not reopen anything.
    await act(async () => resolve(parsedWith(3)));
    expect(onParsed).not.toHaveBeenCalled();
    expect(screen.queryByText(/couldn’t read that file/i)).not.toBeInTheDocument();
  });

  it('aborts an in-flight read when it unmounts', async () => {
    const onAbort = jest.fn();
    const onParse = jest.fn(() => new Promise<ParsedProfile>(() => {}));

    const { unmount } = renderPanel({ onParse, onAbort });
    drop(file());
    await screen.findByText(/reading/i);

    unmount();
    expect(onAbort).toHaveBeenCalled();
  });

  it('in door mode, stays shut until the pill is pressed', () => {
    const onOpened = jest.fn();
    renderPanel({ entry: 'door', emptyLabel: 'Share your work history.', onOpened });

    expect(screen.queryByText('Drag & drop your CV')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /upload your cv/i }));

    expect(screen.getByText('Drag & drop your CV')).toBeInTheDocument();
    expect(onOpened).toHaveBeenCalledTimes(1);
  });
});
