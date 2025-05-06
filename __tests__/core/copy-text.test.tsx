import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyText from '../../components/core/copy-text';
import '@testing-library/jest-dom';

jest.useFakeTimers();

describe('CopyText', () => {
  const textToCopy = 'Hello, world!';
  const childText = 'Click me!';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders children correctly', () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    expect(screen.getByText(childText)).toBeInTheDocument();
  });

  it('copies text to clipboard on click', async () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    fireEvent.click(screen.getByText(childText));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
  });

  it('shows "Copied!" message after click', async () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    fireEvent.click(screen.getByText(childText));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('hides "Copied!" message after 1.5 seconds', async () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    fireEvent.click(screen.getByText(childText));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('calls onCopyCallback if provided', async () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    render(
      <CopyText textToCopy={textToCopy} onCopyCallback={callback}>
        {childText}
      </CopyText>
    );
    await act(async () => {
      fireEvent.click(screen.getByText(childText));
    });
    expect(callback).toHaveBeenCalledWith(textToCopy);
  });

  it('does not fail if onCopyCallback is not provided', () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    fireEvent.click(screen.getByText(childText));
  });

it('resets timer if clicked multiple times quickly', async () => {
  render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);

  await act(async () => {
    fireEvent.click(screen.getByText(childText));
  });

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  await act(async () => {
    fireEvent.click(screen.getByText(childText));
  });

  expect(screen.getByText('Copied!')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
});


  it('has pointer cursor on clickable area', () => {
    render(<CopyText textToCopy={textToCopy}>{childText}</CopyText>);
    const clickable = screen.getByText(childText);
    expect(clickable.className).toContain('cn');
  });
});
