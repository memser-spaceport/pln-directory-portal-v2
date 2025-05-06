import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PopoverDp } from '../../components/core/popover-dp';
import '@testing-library/jest-dom';

describe('PopoverDp', () => {
  const triggerText = 'Open Popover';
  const paneText = 'Popover Content';

  function setup(position = 'bottom') {
    return render(
      <PopoverDp.Wrapper>
        <span>{triggerText}</span>
        <PopoverDp.Pane position={position as "bottom" | "top" | "bottom-right" | "left" }>{paneText}</PopoverDp.Pane>
      </PopoverDp.Wrapper>
    );
  }

  it('renders trigger content', () => {
    setup();
    expect(screen.getByText(triggerText)).toBeInTheDocument();
  });

  it('does not render Pane by default', () => {
    setup();
    expect(screen.queryByText(paneText)).not.toBeInTheDocument();
  });

  it('shows Pane on trigger click', () => {
    setup();
    fireEvent.click(screen.getByText(triggerText));
    expect(screen.getByText(paneText)).toBeInTheDocument();
  });

  it('hides Pane on second trigger click', () => {
    setup();
    const trigger = screen.getByText(triggerText);
    fireEvent.click(trigger);
    expect(screen.getByText(paneText)).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText(paneText)).not.toBeInTheDocument();
  });

  it('closes Pane when clicking outside', () => {
    setup();
    fireEvent.click(screen.getByText(triggerText));
    expect(screen.getByText(paneText)).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(paneText)).not.toBeInTheDocument();
  });

  it('adds .trigger class to non-Pane children', () => {
    setup();
    const trigger = screen.getByText(triggerText);
    expect(trigger.parentElement).toHaveClass('trigger');
  });

  it('removes event listener on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = setup();
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  it('renders Pane children', () => {
    setup();
    fireEvent.click(screen.getByText(triggerText));
    expect(screen.getByText(paneText)).toBeInTheDocument();
  });
});