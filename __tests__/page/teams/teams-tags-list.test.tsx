import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamsTagsList from '@/components/page/teams/teams-tags-list';
import { ITag } from '@/types/teams.types';

describe('TeamsTagsList Component', () => {
  const mockTags: ITag[] = [
    { title: 'Tag1' },
    { title: 'Tag2' },
    { title: 'Tag3' },
    { title: 'Tag4' },
  ];

  it('renders the correct number of tags based on noOfTagsToShow', () => {
    render(<TeamsTagsList tags={mockTags} noOfTagsToShow={2} />);
    const displayedTags = screen.getAllByTestId(/tag-\d+/);
    expect(displayedTags).toHaveLength(4);
  });

  it('displays additional tags count when there are more tags than noOfTagsToShow', () => {
    render(<TeamsTagsList tags={mockTags} noOfTagsToShow={2} />);
    const additionalTags = screen.getAllByText('+2');
    expect(additionalTags[0]).toBeInTheDocument();
  });

  it('does not display additional tags count when all tags are shown', () => {
    render(<TeamsTagsList tags={mockTags} noOfTagsToShow={4} />);
    const additionalTags = screen.queryByText('+');
    expect(additionalTags).not.toBeInTheDocument();
  });

  it('displays tooltips with correct content for each tag', () => {
    render(<TeamsTagsList tags={mockTags} noOfTagsToShow={2} />);
    mockTags.slice(0, 2).forEach((tag, index) => {
      const tagElement = screen.getAllByTestId(`tag-${index}`);
      const button = tagElement[0].querySelector('button');
      expect(button).toHaveTextContent(tag.title);
    });
  });
 /*  it('displays all additional tags in the tooltip when hovering over the additional tags indicator', () => {
    render(<TeamsTagsList tags={mockTags} noOfTagsToShow={2} />);
    const additionalTagsIndicator = screen.getAllByTestId('additional-tags');
    additionalTagsIndicator[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    
    mockTags.slice(2).forEach((tag) => {
      expect(screen.getByText(tag.title)).toBeInTheDocument();
    });
  }); */
/* 
  

  

  

  */
});

