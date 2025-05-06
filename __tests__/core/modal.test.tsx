import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/core/modal';
import React, { createRef } from 'react';
import '@testing-library/jest-dom';

// Mock next/image to avoid errors in Jest
jest.mock('next/image', () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />;
});

describe('Modal', () => {
  let mockOnClose: jest.Mock;
  let modalRef: React.RefObject<HTMLDialogElement>;
  const childrenText = 'Test Modal Content';

  beforeEach(() => {
    mockOnClose = jest.fn();
    modalRef = createRef<HTMLDialogElement>();
    render(
      <Modal onClose={mockOnClose} modalRef={modalRef}>
        <div>{childrenText}</div>
      </Modal>
    );
    // Open the dialog for accessibility (jsdom quirk)
    if (modalRef.current) {
      modalRef.current.setAttribute('open', '');
    }
  });

  it('renders the modal dialog and content', () => {
    // Query dialog by class name
    const dialog = document.querySelector('.modal');
    expect(dialog).toBeInTheDocument();
    // The content div should be present
    const contentDiv = dialog?.querySelector('.modal__cn');
    expect(contentDiv).toBeInTheDocument();
  });

  it('renders children inside the modal', () => {
    expect(screen.getByText(childrenText)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    // Find the close button by class name
    const dialog = document.querySelector('.modal');
    const closeBtn = dialog?.querySelector('.modal__cn__closebtn');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders the skip button for focus', () => {
    const dialog = document.querySelector('.modal');
    const skipBtn = dialog?.querySelector('button.modal__cn__hidden');
    expect(skipBtn).toBeInTheDocument();
  });

  it('assigns the ref to the dialog element', () => {
    // The ref should point to the dialog element
    expect(modalRef.current).toBeInstanceOf(HTMLDialogElement);
    expect(modalRef.current).toHaveClass('modal');
  });

  it('renders the close icon image', () => {
    const dialog = document.querySelector('.modal');
    const closeBtn = dialog?.querySelector('.modal__cn__closebtn');
    expect(closeBtn).toBeInTheDocument();
    const img = closeBtn?.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icons/close.svg');
    expect(img).toHaveAttribute('alt', 'close');
  });

  it('renders with correct class names for styling', () => {
    const dialog = document.querySelector('.modal');
    expect(dialog).toHaveClass('modal');
    const contentDiv = dialog?.querySelector('.modal__cn');
    expect(contentDiv).toHaveClass('modal__cn');
    const closeBtn = dialog?.querySelector('.modal__cn__closebtn');
    expect(closeBtn).toHaveClass('modal__cn__closebtn');
    const skipBtn = dialog?.querySelector('.modal__cn__hidden');
    expect(skipBtn).toHaveClass('modal__cn__hidden');
  });
}); 
