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

  /**
   * The drop area used to sit behind an "Upload your CV" pill, with a "← Back"
   * above it to undo the reveal. Both are gone: a button that reveals a button,
   * and a stray control belonging to no card. The panel opens on the thing it is
   * for, wherever it mounts.
   */
  it('shows the drop area immediately, with nothing to press first and nothing to go back to', () => {
    renderPanel({});

    expect(screen.getByText('Drag & drop your CV')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload your cv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  /**
   * The bar over a wait nobody can measure.
   *
   * The server reports a status and never a fraction, so the curve is invented.
   * What is NOT invented is the one claim the bar makes by reaching the end, and
   * these pin it from both sides: 100% appears only when a read actually came
   * back, and a read that failed never gets there.
   */
  describe('the reading progress bar', () => {
    /** Let promise continuations run WITHOUT letting any timer fire. */
    const flushMicrotasks = async () => {
      await act(async () => {});
      await act(async () => {});
    };

    it('moves while reading, and does not reach the end on its own', async () => {
      renderPanel({ onParse: jest.fn(() => new Promise<ParsedProfile>(() => {})) });

      drop(file('polina-cv.pdf'));

      const bar = await screen.findByRole('progressbar');
      // It starts moving on its own — a bar that sat at 0 would say the wait
      // hadn't begun.
      await waitFor(() => expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0));
      // And it cannot arrive by itself. Only the resolved parse gets to 100, so
      // a full bar is never a guess about a read still in flight.
      expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThan(100);
    });

    it('is at 100% at the moment the result is handed up, not after', async () => {
      let valueAtHandoff: string | null = null;
      /* Read out of the DOM from inside the handler: this is the exact instant
         the row gives way to the review, and the assertion is that the person
         could have seen the bar finish before it did. Checking afterwards would
         prove nothing — the row is gone by then. */
      const onParsed = jest.fn(() => {
        valueAtHandoff = screen.getByRole('progressbar').getAttribute('aria-valuenow');
      });

      renderPanel({ onParse: jest.fn().mockResolvedValue(parsedWith(3)), onParsed });
      drop(file());

      await waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1));
      expect(valueAtHandoff).toBe('100');
    });

    /**
     * THE WINDOW THE OLD TESTS COULDN'T SEE.
     *
     * 'Cancel during a read aborts it' clicks Cancel *before* the promise
     * resolves, so it never gets past the first token check. Holding the row so
     * the finished bar can be seen opens a second window — after the result is
     * in hand, before the review is opened — and Cancel lands squarely in it.
     * Without the second token check the review opens anyway, over a parse whose
     * request has already been aborted.
     */
    it('a Cancel while the bar is finishing still opens nothing', async () => {
      const onParsed = jest.fn();
      const onAbort = jest.fn();
      let resolve!: (p: ParsedProfile) => void;
      const onParse = jest.fn(() => new Promise<ParsedProfile>((r) => (resolve = r)));

      renderPanel({ onParse, onParsed, onAbort });
      drop(file());
      await screen.findByRole('progressbar');

      // The result lands; the row is now holding at 100% and has not given way.
      await act(async () => {
        resolve(parsedWith(3));
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onAbort).toHaveBeenCalled();

      // Past the hold, the handoff must not happen.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 500));
      });
      expect(onParsed).not.toHaveBeenCalled();
    });

    /**
     * A failure ends the wait; it does not complete it. Filling the bar and then
     * saying "we couldn't read that file" would claim a success that never
     * happened.
     *
     * Asserted by timing, which is what makes it precise: only microtasks are
     * flushed here, no timer is allowed to fire. The dead end is on screen
     * anyway — which it could not be if this path waited out the completion
     * hold first.
     */
    it('does not complete the bar when the read failed', async () => {
      renderPanel({ onParse: jest.fn().mockRejectedValue(new Error('boom')) });

      drop(file());
      await flushMicrotasks();

      expect(screen.getByText(/couldn’t read that file just now/i)).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
