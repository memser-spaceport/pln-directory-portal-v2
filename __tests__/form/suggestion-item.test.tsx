import { render, screen, fireEvent } from '@testing-library/react';
import SuggestionItem from '@/components/form/suggestion-item';
import { GROUP_TYPES } from '@/utils/constants';
import '@testing-library/jest-dom';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

jest.mock('@/utils/sign-up.utils', () => ({
  getColorObject: (group: string) => ({ color: 'rgb(1,2,3)', bgColor: 'rgb(4,5,6)' })
}));

describe('SuggestionItem', () => {
  const baseSuggestion = {
    logoURL: 'http://logo.com/logo.png',
    name: 'Test Name',
    group: 'Test Group',
  };

  it('renders the suggestion name and group', () => {
    render(<SuggestionItem suggestion={baseSuggestion} onSelect={jest.fn()} />);
    expect(screen.getByText('Test Name')).toBeInTheDocument();
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('renders the logo image if logoURL is provided', () => {
    render(<SuggestionItem suggestion={baseSuggestion} onSelect={jest.fn()} />);
    const img = screen.getByAltText('Test Name');
    expect(img).toHaveAttribute('src', baseSuggestion.logoURL);
    expect(img).toHaveAttribute('width', '22');
    expect(img).toHaveAttribute('height', '22');
  });

  it('renders the default team image if logoURL is missing and group is TEAM', () => {
    render(
      <SuggestionItem
        suggestion={{ ...baseSuggestion, logoURL: '', group: GROUP_TYPES.TEAM }}
        onSelect={jest.fn()}
      />
    );
    const img = screen.getByAltText('Test Name');
    expect(img).toHaveAttribute('src', '/icons/team-default-profile.svg');
  });

  it('renders the default project image if logoURL is missing and group is not TEAM', () => {
    render(
      <SuggestionItem
        suggestion={{ ...baseSuggestion, logoURL: '', group: 'OTHER_GROUP' }}
        onSelect={jest.fn()}
      />
    );
    const img = screen.getByAltText('Test Name');
    expect(img).toHaveAttribute('src', '/icons/default-project.svg');
  });

  it('sets the image alt attribute to the suggestion name', () => {
    render(<SuggestionItem suggestion={baseSuggestion} onSelect={jest.fn()} />);
    expect(screen.getByAltText('Test Name')).toBeInTheDocument();
  });


  it('applies group color and background from getColorObject', () => {
    render(<SuggestionItem suggestion={baseSuggestion} onSelect={jest.fn()} />);
    const groupBadge = screen.getByText('Test Group');
    expect(groupBadge).toHaveStyle({ color: 'rgb(1,2,3)', background: 'rgb(4,5,6)' });
  });
});
