import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Modal } from '@/components/common/Modal/Modal';

/**
 * `inertBackground` flips every body-level sibling, which is the whole page —
 * the site header included. That containment is the point: a dialog the page
 * behind can still be clicked is not a dialog.
 */
describe('Modal background containment', () => {
  let header: HTMLElement;
  let main: HTMLElement;

  beforeEach(() => {
    header = document.createElement('header');
    header.className = 'layout__header';
    main = document.createElement('main');
    document.body.append(header, main);
  });

  afterEach(() => {
    header.remove();
    main.remove();
  });

  it('takes the whole background out of reach while it is open', () => {
    render(
      <Modal isOpen inertBackground>
        <p>dialog</p>
      </Modal>,
    );

    expect(header.inert).toBe(true);
    expect(main.inert).toBe(true);
  });

  it('gives it back when it closes', async () => {
    const { rerender } = render(
      <Modal isOpen inertBackground>
        <p>dialog</p>
      </Modal>,
    );

    rerender(
      <Modal isOpen={false} inertBackground>
        <p>dialog</p>
      </Modal>,
    );

    expect(header.inert).toBe(false);
    expect(main.inert).toBe(false);
  });
});

/**
 * The overlay is fixed, full-viewport and `pointer-events: auto` at z-index
 * 9999, so one left behind after a close makes the whole page unclickable.
 * `AnimatePresence` is supposed to remove it and does not (framer-motion 12.16
 * on React 19), which is why `Modal` tears the portal down itself.
 */
describe('Modal teardown', () => {
  const renderModal = (isOpen: boolean) =>
    render(
      <Modal isOpen={isOpen}>
        <p>dialog body</p>
      </Modal>,
    );

  it('renders nothing at all before it is opened', () => {
    renderModal(false);

    expect(screen.queryByText('dialog body')).not.toBeInTheDocument();
  });

  it('takes the overlay out of the page once it closes', async () => {
    const { rerender } = renderModal(true);
    expect(screen.getByText('dialog body')).toBeInTheDocument();

    rerender(
      <Modal isOpen={false}>
        <p>dialog body</p>
      </Modal>,
    );

    await waitFor(() => expect(screen.queryByText('dialog body')).not.toBeInTheDocument());
  });

  /* The exit animation still gets its moment — removing the portal in the same
     render as the close would take the fade away. */
  it('keeps it on screen while the exit animation plays', () => {
    const { rerender } = renderModal(true);

    rerender(
      <Modal isOpen={false}>
        <p>dialog body</p>
      </Modal>,
    );

    expect(screen.getByText('dialog body')).toBeInTheDocument();
  });
});
