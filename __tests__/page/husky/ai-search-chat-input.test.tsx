import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const isMobileDevice = jest.fn();
jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  isMobileDevice: () => isMobileDevice(),
}));

import { ChatInput } from '@/components/core/husky/ChatInput';

function renderInput(props: Record<string, unknown> = {}) {
  const ref = createRef<HTMLTextAreaElement>();
  const onTextSubmit = jest.fn();
  const onStopStreaming = jest.fn();
  const onChange = jest.fn();
  render(
    <ChatInput
      ref={ref}
      placeholder="Ask anything"
      onTextSubmit={onTextSubmit}
      onStopStreaming={onStopStreaming}
      onChange={onChange}
      {...props}
    />,
  );
  return { ref, onTextSubmit, onStopStreaming, onChange };
}

beforeEach(() => {
  jest.clearAllMocks();
  isMobileDevice.mockReturnValue(false);
});

describe('AI Search chat input', () => {
  it('submits the question from the send button', () => {
    const { onTextSubmit, onStopStreaming } = renderInput();

    const submit = screen.getByTitle('Submit query');
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(onTextSubmit).toHaveBeenCalledTimes(1);
    expect(onStopStreaming).not.toHaveBeenCalled();
  });

  it('shows a disabled wait button while the answer is loading, even if it is also streaming', () => {
    const { onTextSubmit, onStopStreaming } = renderInput({ isAnswerLoading: true, isLoadingObject: true });

    const wait = screen.getByTitle('Please wait till response is generated.');
    expect(wait).toBeDisabled();
    expect(screen.queryByTitle('Stop')).not.toBeInTheDocument();
    fireEvent.click(wait);

    expect(onTextSubmit).not.toHaveBeenCalled();
    expect(onStopStreaming).not.toHaveBeenCalled();
  });

  it('turns the button into Stop while the answer streams', () => {
    const { onTextSubmit, onStopStreaming } = renderInput({ isLoadingObject: true });

    expect(screen.queryByTitle('Submit query')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Stop'));

    expect(onStopStreaming).toHaveBeenCalledTimes(1);
    expect(onTextSubmit).not.toHaveBeenCalled();
  });

  it('keeps the button clickable at the daily limit so the submit handler can explain the limit', () => {
    const { onTextSubmit } = renderInput({ isLimitReached: true });

    expect(screen.queryByTitle('Submit query')).not.toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(onTextSubmit).toHaveBeenCalledTimes(1);
  });

  it('grows the textarea to fit its content and passes the change on', () => {
    const { ref, onChange } = renderInput();
    const textarea = screen.getByPlaceholderText('Ask anything');
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 80 });

    fireEvent.change(textarea, { target: { value: 'line one\nline two' } });

    expect(ref.current).toBe(textarea);
    expect(textarea.style.height).toBe('81px');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('passes textarea props through', () => {
    renderInput({ value: 'Who works on storage?', readOnly: true, className: 'composer' });

    const textarea = screen.getByPlaceholderText('Ask anything');
    expect(textarea).toHaveValue('Who works on storage?');
    expect(textarea).toHaveAttribute('readonly');
    expect(textarea.parentElement).toHaveClass('root', 'composer');
  });

  it('shows the Shift + Enter hint on desktop', () => {
    renderInput();

    expect(screen.getByText(/to add new line/)).toHaveTextContent('Shift +Enter to add new line');
  });

  it('hides the Shift + Enter hint on a mobile device', () => {
    isMobileDevice.mockReturnValue(true);
    renderInput();

    expect(screen.queryByText(/to add new line/)).not.toBeInTheDocument();
  });
});
