import { render, screen, fireEvent } from '@testing-library/react';
import MemberExperienceDescription from '@/components/page/member-details/member-experience-item';
import { sanitize } from 'isomorphic-dompurify';
import clip from 'text-clipper';
import '@testing-library/jest-dom';

jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn(), // Mocking sanitize function
}));

jest.mock('text-clipper', () => jest.fn());

describe('MemberExperienceDescription Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    desc: `<p>This is a sample description for the member experience. It includes multiple paragraphs, 
    lists, and other HTML elements to provide a detailed overview. The member has worked on several 
    high-profile projects, contributing in various capacities such as project management, software 
    development, and team leadership. In addition, the member has demonstrated an excellent ability 
    to collaborate across departments, ensuring project goals are met in a timely and efficient manner.</p>`,
  };

  it('renders the full description if it is short', () => {
    const shortDesc = '<p>This is a short description.</p>';
    (sanitize as jest.Mock).mockReturnValue(shortDesc); // Correct usage of mockReturnValue
    render(<MemberExperienceDescription desc={shortDesc} />);

    expect(screen.getByText('This is a short description.')).toBeInTheDocument();
    expect(screen.queryByText('Show More')).not.toBeInTheDocument();
  });

 

  it('shows the full description after clicking "Show More"', async () => {
    render(<MemberExperienceDescription {...defaultProps} />);
    
    // Use a regular expression to search for "Show More" text
    const showMoreButton = screen.getByText(/Show More/i);  // More flexible search
  
    // Ensure that "Show More" is present before clicking
    expect(showMoreButton).toBeInTheDocument();
  
    // Simulate a click on the "Show More" button
    fireEvent.click(showMoreButton);
  
    // Check if the full description is displayed after clicking
    const fullDesc = screen.getByText(/timely and efficient manner/i); // Match any part of the full description
    expect(fullDesc).toBeInTheDocument();
  });
  
  it('reverts to truncated description after clicking "Show Less"', () => {
    render(<MemberExperienceDescription {...defaultProps} />);
  
    // Use querySelector to get the "Show More" button
    const showMoreButton = screen.queryByText(/Show More/i);
    expect(showMoreButton).toBeInTheDocument();
  
    // Click the "Show More" button to expand the description
    if (showMoreButton) {
      fireEvent.click(showMoreButton);
    }

    // Now check that the "Show Less" button appears
    const showLessButton = screen.queryByText(/Show Less/i) as HTMLElement; // Add type assertion
    expect(showLessButton).toBeInTheDocument();

    // Click the "Show Less" button to collapse the description
    fireEvent.click(showLessButton);

    // Ensure "Show More" button reappears after collapsing
    const revertedShowMoreButton = screen.queryByText(/Show More/i);
    expect(revertedShowMoreButton).toBeInTheDocument();
  });


  it('renders nothing when desc prop is blank or empty', () => {
    // Blank description
    const blankProps = { desc: '' };
    render(<MemberExperienceDescription {...blankProps} />);

    // Check that the description container is not rendered
    const descriptionContainer = screen.queryByTestId('description-container'); // Replace queryByClass with queryByTestId
    expect(descriptionContainer).not.toBeInTheDocument();

    // Ensure "Show More" button is not rendered
    const showMoreButton = screen.queryByText(/Show More/i);
    expect(showMoreButton).not.toBeInTheDocument();
  });
});
