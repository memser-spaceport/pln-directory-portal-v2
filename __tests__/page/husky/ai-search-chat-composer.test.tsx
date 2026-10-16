import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatComposer } from '@/components/page/husky/Chat/components/ChatComposer';

describe('AI Search composer', () => {
  it('dims the send button again after the parent clears the field on Send', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onTextSubmit = jest.fn(() => {
      ref.current!.value = '';
    });
    render(<ChatComposer ref={ref} placeholder="Ask" onTextSubmit={onTextSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onTextSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('treats a field of spaces as empty', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<ChatComposer ref={ref} placeholder="Ask" />);

    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('asks the member to wait while the answer is pending', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<ChatComposer ref={ref} placeholder="Ask" defaultValue="hello" isAnswerLoading />);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'title',
      'Please wait till response is generated.',
    );
  });

  it('labels the stop button for assistive tech while the answer streams', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<ChatComposer ref={ref} placeholder="Ask" isLoadingObject />);

    expect(screen.getByRole('button', { name: 'Stop answering' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('re-reads the field when the answer finishes, after the parent cleared it meanwhile', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { rerender } = render(<ChatComposer ref={ref} placeholder="Ask" />);
    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: 'hello' } });

    rerender(<ChatComposer ref={ref} placeholder="Ask" isLoadingObject />);
    act(() => {
      ref.current!.value = '';
    });
    rerender(<ChatComposer ref={ref} placeholder="Ask" />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('passes typing through to the parent', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onChange = jest.fn();
    render(<ChatComposer ref={ref} placeholder="Ask" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: 'hi' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});
