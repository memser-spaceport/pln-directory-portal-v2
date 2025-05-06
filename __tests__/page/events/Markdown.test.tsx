/**
 * @fileoverview Unit tests for the Markdown component.
 * Covers all branches, edge cases, and user interactions.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Markdown } from '@/components/common/Markdown';

// --- Mocks ---
// Mock HuskyCodeBlock for code rendering
jest.mock('@/components/core/husky/husky-code-block', () => (props: any) => <code data-testid="husky-code-block">{props.children}</code>);

describe('Markdown', () => {
  // --- Render tests for various markdown elements ---
  it('renders anchor links with correct href and target', () => {
    render(<Markdown>{'[Link](https://example.com)'}</Markdown>);
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveStyle('color: blue');
  });

  it('renders paragraphs with custom style', () => {
    render(<Markdown>{'This is a paragraph.'}</Markdown>);
    const para = screen.getByText('This is a paragraph.');
    expect(para.tagName.toLowerCase()).toBe('p');
    expect(para).toHaveStyle('margin-bottom: 6px');
  });

  it('renders headings h1-h4 with custom style', () => {
    render(<Markdown>{'# H1\n## H2\n### H3\n#### H4'}</Markdown>);
    expect(screen.getByText('H1').tagName.toLowerCase()).toBe('h1');
    expect(screen.getByText('H2').tagName.toLowerCase()).toBe('h2');
    expect(screen.getByText('H3').tagName.toLowerCase()).toBe('h3');
    expect(screen.getByText('H4').tagName.toLowerCase()).toBe('h4');
  });

  it('renders ordered and unordered lists with custom style', () => {
    render(<Markdown>{'- Item 1\n- Item 2\n1. First\n2. Second'}</Markdown>);
    expect(screen.getByText('Item 1').closest('ul')).toHaveStyle('margin-left: 16px');
    expect(screen.getByText('First').closest('ol')).toHaveStyle('margin-left: 16px');
  });

  it('renders code blocks using HuskyCodeBlock', () => {
    render(<Markdown>{'`inline code`'}</Markdown>);
    expect(screen.getByTestId('husky-code-block')).toHaveTextContent('inline code');
  });

  it('renders tables with custom style', () => {
    render(<Markdown>{'| H | H2 |\n|---|---|\n| C | D |'}</Markdown>);
    expect(screen.getByRole('table')).toHaveStyle('border-collapse: collapse');
    expect(screen.getByRole('columnheader')).toHaveStyle('background-color: #f5f5f5');
    expect(screen.getByRole('cell')).toHaveStyle('border: 1px solid #ddd');
  });

  // --- Edge case: renders with empty string ---
  it('renders with empty string', () => {
    const { container } = render(<Markdown>{''}</Markdown>);
    expect(container).toBeInTheDocument();
  });

  // --- Edge case: renders with className ---
  it('renders with custom className', () => {
    render(<Markdown className="custom-md">{'Text'}</Markdown>);
    expect(screen.getByText('Text').parentElement).toHaveClass('custom-md');
  });
}); 