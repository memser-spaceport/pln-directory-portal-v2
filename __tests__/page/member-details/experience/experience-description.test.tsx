import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExperienceDescription from '@/components/page/member-details/experience/experience-description';

// Mock DOMPurify
jest.mock('dompurify');

// Mock text-clipper
jest.mock('text-clipper');

// Mock CSS modules
jest.mock('@/components/page/member-details/experience/list.module.css', () => ({
  memberDetail__experience__item__detail__description: 'description-class',
  memberDetail__experience__item__detail__description__text: 'description-text-class',
  memberDetail__experience__item__detail__description__text__more: 'show-more-class',
}));

// Import and get typed mocks
import DOMPurify from 'dompurify';
import clip from 'text-clipper';

const mockSanitize = jest.mocked(DOMPurify.sanitize);
const mockClip = jest.mocked(clip);

describe('ExperienceDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window object for each test
    Object.defineProperty(window, 'window', {
      value: window,
      writable: true,
    });
  });


  it('renders sanitized description when provided', async () => {
    const description = 'This is a test description';
    const sanitizedDescription = 'This is a test description';
    const clippedDescription = 'This is a test description';

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={description} />);

    await waitFor(() => {
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    expect(mockSanitize).toHaveBeenCalledWith(description, {
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['a'],
    });
  });

  it('shows clipped description when content is long', async () => {
    const longDescription = 'A'.repeat(300);
    const sanitizedDescription = 'A'.repeat(300);
    const clippedDescription = 'A'.repeat(250) + '...';

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={longDescription} />);

    await waitFor(() => {
      expect(mockClip).toHaveBeenCalledWith(sanitizedDescription, 255, { html: true, maxLines: 2 });
    });
  });

  it('shows "Show more" button when content is clipped', async () => {
    const longDescription = 'A'.repeat(300);
    const sanitizedDescription = 'A'.repeat(300);
    const clippedDescription = 'A'.repeat(250);

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={longDescription} />);

    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
  });

  it('does not show "Show more" button when content is not clipped', async () => {
    const shortDescription = 'Short description';
    const sanitizedDescription = 'Short description';
    const clippedDescription = 'Short description';

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={shortDescription} />);

    await waitFor(() => {
      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    });
  });

  it('toggles between clipped and full description when "Show more" is clicked', async () => {
    const longDescription = 'A'.repeat(300);
    const sanitizedDescription = 'A'.repeat(300);
    const clippedDescription = 'A'.repeat(250);

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={longDescription} />);

    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    // Click "Show more"
    fireEvent.click(screen.getByText('Show more'));

    // Should now show full description
    await waitFor(() => {
      const paragraphs = screen.getAllByRole('paragraph');
      const fullDescParagraph = paragraphs.find(p => 
        p.innerHTML === sanitizedDescription
      );
      expect(fullDescParagraph).toBeInTheDocument();
    });
  });

  it('handles description with HTML content', async () => {
    const htmlDescription = '<p>This is <strong>bold</strong> text with <a href="https://example.com">a link</a></p>';
    const sanitizedDescription = '<p>This is <strong>bold</strong> text with <a href="https://example.com">a link</a></p>';
    const clippedDescription = '<p>This is <strong>bold</strong> text with <a href="https://example.com">a link</a></p>';

    mockSanitize.mockReturnValue(sanitizedDescription);
    mockClip.mockReturnValue(clippedDescription);

    render(<ExperienceDescription description={htmlDescription} />);

    await waitFor(() => {
      expect(mockSanitize).toHaveBeenCalledWith(htmlDescription, {
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ADD_ATTR: ['target', 'rel'],
        ADD_TAGS: ['a'],
      });
    });
  });


  it('re-renders when description prop changes', async () => {
    const description1 = 'First description';
    const description2 = 'Second description';
    
    mockSanitize.mockReturnValue('First description');
    mockClip.mockReturnValue('First description');

    const { rerender } = render(<ExperienceDescription description={description1} />);

    await waitFor(() => {
      expect(screen.getByText('First description')).toBeInTheDocument();
    });

    // Change description
    mockSanitize.mockReturnValue('Second description');
    mockClip.mockReturnValue('Second description');
    
    rerender(<ExperienceDescription description={description2} />);

    await waitFor(() => {
      expect(screen.getByText('Second description')).toBeInTheDocument();
      expect(screen.queryByText('First description')).not.toBeInTheDocument();
    });
  });
});
