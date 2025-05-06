import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomLinkDialog from '@/components/ui/link-dialog';

describe('CustomLinkDialog', () => {
  const baseProps = {
    isOpen: true,
    linkObj: { text: 'Google', url: 'https://google.com' },
    onRequestClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with initial values', () => {
    render(<CustomLinkDialog {...baseProps} />);
    expect(screen.getByRole('heading', { name: /insert link/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Google')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://google.com')).toBeInTheDocument();
  });

  it('calls onRequestClose when cancel is clicked', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(baseProps.onRequestClose).toHaveBeenCalled();
  });

  it('calls onSave with correct values and closes on valid input', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Docs' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'https://docs.com' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Docs', 'https://docs.com');
    expect(baseProps.onRequestClose).toHaveBeenCalled();
  });

  it('shows error if text is empty', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(screen.getByText('Text field cannot be empty')).toBeInTheDocument();
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('shows error if url is empty', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(screen.getByText('URL field cannot be empty')).toBeInTheDocument();
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('shows error if url is invalid', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(screen.getByText('Please enter a valid URL.')).toBeInTheDocument();
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('shows error if url is undefined', () => {
    render(<CustomLinkDialog {...baseProps} linkObj={{ text: 'Test', url: undefined as any }} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(screen.getByText('URL field cannot be empty')).toBeInTheDocument();
  });

  it('resets state when dialog is reopened with new linkObj', () => {
    const { rerender } = render(<CustomLinkDialog {...baseProps} isOpen={false} />);
    rerender(<CustomLinkDialog {...baseProps} isOpen={true} linkObj={{ text: 'Bing', url: 'https://bing.com' }} />);
    expect(screen.getByDisplayValue('Bing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://bing.com')).toBeInTheDocument();
  });

  it('prevents Enter key from submitting in text input', () => {
    render(<CustomLinkDialog {...baseProps} />);
    const textInput = screen.getByPlaceholderText('Enter link text');
    fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter' });
    // Should not close or call onSave
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('prevents Enter key from submitting in url input', () => {
    render(<CustomLinkDialog {...baseProps} />);
    const urlInput = screen.getByPlaceholderText('Enter link URL');
    fireEvent.keyDown(urlInput, { key: 'Enter', code: 'Enter' });
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('does not render dialog if isOpen is false', () => {
    render(<CustomLinkDialog {...baseProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /insert link/i })).not.toBeInTheDocument();
  });

  it('shows error if url is a string but not a valid domain (regex negative branch)', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'http://invalid-url' } }); // no TLD
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(screen.getByText('Please enter a valid URL.')).toBeInTheDocument();
    expect(baseProps.onSave).not.toHaveBeenCalled();
  });

  it('calls onSave for a valid but uncommon URL (regex positive branch)', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'http://foo.bar' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'http://foo.bar');
  });

  it('calls onSave for a valid URL with port and path (regex full branch)', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'https://foo.bar:8080/path' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'https://foo.bar:8080/path');
  });

  it('calls onSave for a valid URL with 2-char TLD', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'https://foo.io' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'https://foo.io');
  });

  it('calls onSave for a valid URL with 5-char TLD', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'https://foo.store' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'https://foo.store');
  });

  it('calls onSave for a valid URL with no protocol', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'foo.bar' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'foo.bar');
  });

  it('calls onSave for a valid URL with a dash in the domain', () => {
    render(<CustomLinkDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Enter link text'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Enter link URL'), { target: { value: 'https://foo-bar.com' } });
    fireEvent.click(screen.getByRole('button', { name: /insert link/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('Test', 'https://foo-bar.com');
  });
}); 