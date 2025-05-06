// Unit test for TagContainer component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagContainer from '@/components/ui/tag-container';
import { IFilterSelectedItem, IUserInfo } from '@/types/shared.types';

// Mock triggerLoader utility
jest.mock('@/utils/common.utils', () => ({
  triggerLoader: jest.fn(),
}));

const mockTriggerLoader = require('@/utils/common.utils').triggerLoader;

// Helper: create mock items
const createItems = (count: number, opts: Partial<IFilterSelectedItem> = {}) =>
  Array.from({ length: count }, (_, i) => ({
    value: `Tag${i + 1}`,
    selected: opts.selected ?? false,
    disabled: opts.disabled ?? false,
    ...opts,
  }));

const baseProps = {
  onTagClickHandler: jest.fn(),
  items: createItems(5),
  name: 'tags',
  label: 'Tags',
  initialCount: 3,
  userInfo: undefined as IUserInfo | undefined,
  isUserLoggedIn: true,
  page: 'test-page',
};

describe('TagContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM for overlays
    document.body.innerHTML = '';
  });

  it('renders with required props and tags', () => {
    render(<TagContainer {...baseProps} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
    baseProps.items.slice(0, baseProps.initialCount).forEach(item => {
      expect(screen.getByText(item.value)).toBeInTheDocument();
    });
  });

  it('renders all tags if selected tag is beyond initialCount (isShowMore)', () => {
    const items = createItems(12, { selected: false });
    items[11].selected = true; // index 11 > 9
    render(<TagContainer {...baseProps} items={items} />);
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeInTheDocument();
    });
  });

  it('renders show more/less button if more than 10 items', () => {
    const items = createItems(12);
    render(<TagContainer {...baseProps} items={items} />);
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('toggles show more/less when button is clicked', () => {
    const items = createItems(12);
    render(<TagContainer {...baseProps} items={items} />);
    const btn = screen.getByRole('button', { name: /show more/i });
    fireEvent.click(btn);
    expect(btn).toHaveTextContent(/show less/i);
    // All tags should be visible
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeInTheDocument();
    });
    // Clicking again collapses
    fireEvent.click(btn);
    expect(btn).toHaveTextContent(/show more/i);
  });

  it('shows count tag in show more/less if not all tags are visible', () => {
    const items = createItems(15);
    render(<TagContainer {...baseProps} items={items} />);
    // Show more count tag (should be 12)
    expect(screen.getByTestId('ui-tag-12')).toBeInTheDocument();
    // Expand, count tag disappears
    fireEvent.click(screen.getByRole('button', { name: /show more/i }));
    expect(screen.queryByTestId('ui-tag-12')).not.toBeInTheDocument();
  });

  it('calls onTagClickHandler when a tag is clicked', () => {
    render(<TagContainer {...baseProps} />);
    const tag = screen.getByText('Tag1');
    fireEvent.click(tag);
    expect(baseProps.onTagClickHandler).toHaveBeenCalled();
  });

  it('renders nothing if items is empty', () => {
    render(<TagContainer {...baseProps} items={[]} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.queryByText('Tag1')).not.toBeInTheDocument();
  });

  it('renders disabled tags', () => {
    const items = createItems(3, { disabled: true });
    render(<TagContainer {...baseProps} items={items} />);
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeDisabled();
    });
  });

  it('renders selected tags', () => {
    const items = createItems(3, { selected: true });
    render(<TagContainer {...baseProps} items={items} />);
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeInTheDocument();
    });
  });

  describe('Private filter overlay', () => {
    const privateName = 'region'; // in PRIVATE_FILTERS
    const label = 'Region';
    const overlayId = `tags-container__access-container${label}`;
    const items = createItems(3);
    const props = {
      ...baseProps,
      name: privateName,
      label,
      isUserLoggedIn: false,
      items,
    };

    beforeEach(() => {
      // Render and get overlay element
      render(<TagContainer {...props} />);
    });

    it('shows overlay on mouse enter if not logged in and filter is private', () => {
      const container = screen.getByText(label).closest('.tags-container');
      const overlay = document.getElementById(overlayId);
      expect(overlay).toHaveStyle('display: none');
      fireEvent.mouseEnter(container!);
      expect(overlay).toHaveStyle('display: flex');
    });

    it('hides overlay on mouse leave', () => {
      const container = screen.getByText(label).closest('.tags-container');
      const overlay = document.getElementById(overlayId);
      fireEvent.mouseEnter(container!);
      expect(overlay).toHaveStyle('display: flex');
      fireEvent.mouseLeave(container!);
      expect(overlay).toHaveStyle('display: none');
    });

    it('calls triggerLoader when login button is clicked', () => {
      const container = screen.getByText(label).closest('.tags-container');
      fireEvent.mouseEnter(container!);
      const btn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(btn);
      expect(mockTriggerLoader).toHaveBeenCalledWith(true);
    });
  });

  it('does not show overlay for non-private filters', () => {
    const label = 'NotPrivate';
    const overlayId = `tags-container__access-container${label}`;
    render(<TagContainer {...baseProps} name="notPrivate" label={label} isUserLoggedIn={false} />);
    const container = screen.getByText(label).closest('.tags-container');
    const overlay = document.getElementById(overlayId);
    fireEvent.mouseEnter(container!);
    expect(overlay).toHaveStyle('display: none');
  });

  it('does not show overlay if user is logged in, even for private filters', () => {
    const label = 'Region';
    const overlayId = `tags-container__access-container${label}`;
    render(<TagContainer {...baseProps} name="region" label={label} isUserLoggedIn={true} />);
    const container = screen.getByText(label).closest('.tags-container');
    const overlay = document.getElementById(overlayId);
    fireEvent.mouseEnter(container!);
    expect(overlay).toHaveStyle('display: none');
  });

  it('updates visible tags when items prop changes', () => {
    const { rerender } = render(<TagContainer {...baseProps} items={createItems(2)} />);
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    rerender(<TagContainer {...baseProps} items={createItems(4)} />);
    // Only first 3 tags should be visible
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
    expect(screen.getByText('Tag3')).toBeInTheDocument();
    expect(screen.queryByText('Tag4')).not.toBeInTheDocument();
  });

  it('handles edge case: all tags selected and more than 10', () => {
    const items = createItems(12, { selected: true });
    render(<TagContainer {...baseProps} items={items} />);
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeInTheDocument();
    });
  });

  it('handles edge case: all tags disabled and more than 10', () => {
    const items = createItems(12, { disabled: true });
    render(<TagContainer {...baseProps} items={items} />);
    // Reveal all tags
    fireEvent.click(screen.getByRole('button', { name: /show more/i }));
    items.forEach(item => {
      expect(screen.getByText(item.value)).toBeDisabled();
    });
  });

  it('handles edge case: no initialCount (defaults to 0)', () => {
    render(<TagContainer {...baseProps} initialCount={0} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('renders with undefined userInfo', () => {
    render(<TagContainer {...baseProps} userInfo={undefined} />);
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('does not show all tags if no tag is selected beyond index 9 (isShowMore is false)', () => {
    const items = createItems(12, { selected: false });
    // Optionally, set a selected tag at index 5 (≤ 9)
    items[5].selected = true;
    render(<TagContainer {...baseProps} items={items} />);
    // Only initialCount tags should be visible
    for (let i = 0; i < baseProps.initialCount; i++) {
      expect(screen.getByText(`Tag${i + 1}`)).toBeInTheDocument();
    }
    // Tag12 should NOT be visible
    expect(screen.queryByText('Tag12')).not.toBeInTheDocument();
  });
});

