import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The CV reader's width.
 *
 * It rendered at 600px with a wider page inside it, clipped by its own scroller,
 * because two numbers had to agree by hand and did not: the card asked for
 * `max-width: 720px`, but `Modal`'s container caps at 600 and the card is
 * `width: 100%` inside it — so the card was 600, while the canvas was a
 * hardcoded 640.
 *
 * Both halves are pinned here: the dialog widens its container, and the canvas
 * is handed the space it actually has rather than a constant.
 */

let measured = 0;

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [jest.fn(), { width: measured }],
}));

// The dynamic import target. Exposes the width it was handed, which is the
// number the bug was about.
jest.mock('@/components/common/profile/StoredCv/CvPdfPage', () => ({
  __esModule: true,
  default: ({ width }: { width: number }) => <div data-testid="pdf-canvas" data-width={width} />,
}));

import { CvPreviewModal } from '@/components/common/profile/StoredCv/CvPreviewModal';
import modalCss from '@/components/common/Modal/Modal.module.scss';
import previewCss from '@/components/common/profile/StoredCv/CvPreviewModal.module.scss';

const cv = {
  fileName: 'ada-lovelace-cv.pdf',
  url: 'https://example.test/cv.pdf',
  size: 120_000,
  uploadedAt: '2026-09-01T00:00:00.000Z',
};

const open = () => render(<CvPreviewModal cv={cv as never} isOpen onClose={jest.fn()} />);

const canvasWidth = async () => Number((await screen.findByTestId('pdf-canvas')).getAttribute('data-width'));

describe('the CV preview dialog', () => {
  afterEach(() => {
    measured = 0;
  });

  /* The primary fix. `Modal` puts its own `.modalContainer` (max-width 600px) on
     the same node, and a card that is `width: 100%` cannot escape it — so the
     dialog has to hand Modal a class of its own. Asserted on the class rather
     than a computed width because jsdom applies no stylesheet. */
  it('widens Modal’s container instead of inheriting the 600px default', () => {
    measured = 800;
    const { baseElement } = open();

    const container = baseElement.querySelector(`.${modalCss.modalContainer}`);
    expect(container).not.toBeNull();
    expect(container).toHaveClass(previewCss.container);
  });

  it('renders the page at the width it actually has', async () => {
    measured = 700;
    open();

    expect(await canvasWidth()).toBe(700);
  });

  /* Never wider than the space measured — that overflow, clipped by `.page`'s
     own scroller, was the reported symptom. */
  it('never hands the canvas more room than the reader has', async () => {
    measured = 420;
    open();

    expect(await canvasWidth()).toBe(420);
  });

  /* …and never wider than the document itself: A4 at 96dpi is 794, and
     upscaling past it only blurs the page. */
  it('stops at A4 rather than upscaling on a wide screen', async () => {
    measured = 1200;
    open();

    expect(await canvasWidth()).toBe(794);
  });

  /* Before the first layout there is no width to render at. The reader shows its
     loading line rather than handing react-pdf a zero-width page. */
  it('waits for a measurement before drawing', () => {
    measured = 0;
    open();

    expect(screen.queryByTestId('pdf-canvas')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
