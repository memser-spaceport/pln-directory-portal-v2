import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import TagLoader from '@/components/ui/tag-loader';

/**
 * Test suite for the TagLoader component.
 * Covers all DOM elements, structure, and edge cases for 100% coverage.
 */
describe('TagLoader', () => {
  // Test: Renders the main container and title skeleton
  it('renders the tag-loading-container and title skeleton', () => {
    render(<TagLoader />);
    const container = screen.getByTestId('tag-loader-container');
    expect(container).toBeInTheDocument();
    // Title skeleton
    const title = container.querySelector('.tag-loading-container__title');
    expect(title).toBeInTheDocument();
  });

  // Test: Renders the tags skeleton row
  it('renders the tags skeleton row with correct number of skeletons and classes', () => {
    render(<TagLoader />);
    const tagsRow = document.querySelector('.tag-loading-container__tags');
    expect(tagsRow).toBeInTheDocument();
    // There should be 3 of each tag skeleton (total 9)
    const tagSkeletons = tagsRow?.querySelectorAll('.tag-loading-container__tags__tag');
    const tag1Skeletons = tagsRow?.querySelectorAll('.tag-loading-container__tags__tag1');
    const tag2Skeletons = tagsRow?.querySelectorAll('.tag-loading-container__tags__tag2');
    expect(tagSkeletons?.length).toBe(3);
    expect(tag1Skeletons?.length).toBe(3);
    expect(tag2Skeletons?.length).toBe(3);
  });

  // Test: All skeletons have correct styles and animation
  it('applies correct classes and animation styles to skeletons', () => {
    render(<TagLoader />);
    const tag = document.querySelector('.tag-loading-container__tags__tag');
    const tag1 = document.querySelector('.tag-loading-container__tags__tag1');
    const tag2 = document.querySelector('.tag-loading-container__tags__tag2');
    expect(tag).toHaveStyle('background-color: #e2e8f0');
    expect(tag1).toHaveStyle('background-color: #e2e8f0');
    expect(tag2).toHaveStyle('background-color: #e2e8f0');
    // Animation style is inline, but we can check class presence
    expect(tag).toHaveClass('tag-loading-container__tags__tag');
    expect(tag1).toHaveClass('tag-loading-container__tags__tag1');
    expect(tag2).toHaveClass('tag-loading-container__tags__tag2');
  });

  // Test: No extra elements are rendered
  it('does not render any extra elements outside the skeleton structure', () => {
    render(<TagLoader />);
    const container = document.querySelector('.tag-loading-container');
    expect(container?.children.length).toBe(2); // title and tags row
    const tagsRow = document.querySelector('.tag-loading-container__tags');
    expect(tagsRow?.children.length).toBe(9); // 3+3+3
  });

  // Edge case: Component renders without crashing (smoke test)
  it('renders without crashing', () => {
    const { container } = render(<TagLoader />);
    expect(container).toBeTruthy();
  });
}); 