import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HuskyAskPrompts from '@/components/core/husky/husky-ask-prompts';
import { getIrlPrompts, getProjectsPrompts, getTeamPrompts } from '@/services/home.service';

// Mock the service functions
jest.mock('@/services/home.service', () => ({
  getIrlPrompts: jest.fn(),
  getProjectsPrompts: jest.fn(),
  getTeamPrompts: jest.fn(),
}));

describe('HuskyAskPrompts', () => {
  const mockOnPromptItemClicked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    // Mock the service responses
    (getTeamPrompts as jest.Mock).mockResolvedValue([{ name: 'Team A', logo: '/path/to/logo' }]);
    (getProjectsPrompts as jest.Mock).mockResolvedValue([{ name: 'Project A', logo: '/path/to/logo' }]);
    (getIrlPrompts as jest.Mock).mockResolvedValue([{ name: 'IRL A', logo: '/path/to/logo' }]);

    render(<HuskyAskPrompts suggestionTopicSelected="teams" onPromptItemClicked={mockOnPromptItemClicked} />);

    // Check if the component renders correctly
    expect(screen.getByTestId('husky-ask-prompts')).not.toBeNull();
  });

  test('displays prompts based on selected topic', async () => {
    (getTeamPrompts as jest.Mock).mockResolvedValue([{ name: 'Team A', logo: '/path/to/logo', relatedQuestions: ['Question 1', 'Question 2'] }]);
    (getProjectsPrompts as jest.Mock).mockResolvedValue([{ name: 'Project A', logo: '/path/to/logo', relatedQuestions: ['Question 3', 'Question 4'] }]);
    (getIrlPrompts as jest.Mock).mockResolvedValue([{ name: 'IRL A', logo: '/path/to/logo', relatedQuestions: ['Question 5', 'Question 6'] }]);

    render(<HuskyAskPrompts suggestionTopicSelected="teams" onPromptItemClicked={mockOnPromptItemClicked} />);

    await waitFor(() => {
      expect(screen.getByText('Team A')).not.toBeNull();
      expect(screen.getByText('Question 1')).not.toBeNull();
      expect(screen.getByText('Question 2')).not.toBeNull();
    });
  });

  test('filters prompts based on search input', async () => {
    (getTeamPrompts as jest.Mock).mockResolvedValue([{ name: 'Team A', logo: '/path/to/logo', relatedQuestions: ['Question 1', 'Question 2'] }, { name: 'Team B', logo: '/path/to/logo', relatedQuestions: ['Question 3', 'Question 4'] }]);
    render(<HuskyAskPrompts suggestionTopicSelected="teams" onPromptItemClicked={mockOnPromptItemClicked} />);

    await waitFor(() => {
      expect(screen.getByText('Team A')).not.toBeNull();
      expect(screen.getByText('Team B')).not.toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'Team A' } });

    await waitFor(() => {
      expect(screen.getByText('Team A')).not.toBeNull();
      expect(screen.queryByText('Team B')).toBeNull();
    });
  });

  test('calls onPromptItemClicked when a related question is clicked', async () => {
    (getTeamPrompts as jest.Mock).mockResolvedValue([{ name: 'Team A', logo: '/path/to/logo', relatedQuestions: ['Question 1', 'Question 2'] }]);
    render(<HuskyAskPrompts suggestionTopicSelected="teams" onPromptItemClicked={mockOnPromptItemClicked} />);

    await waitFor(() => {
      expect(screen.getByText('Question 1')).not.toBeNull();
    });

    fireEvent.click(screen.getByText('Question 1'));
    expect(mockOnPromptItemClicked).toHaveBeenCalledWith('Question 1');
  });

  test('displays no results found when no prompts match the search', async () => {
    window.innerWidth = 1024;
    (getTeamPrompts as jest.Mock).mockResolvedValue([{ name: 'Team A', logo: '/path/to/logo', relatedQuestions: ['Question 1', 'Question 2'] }]);
    render(<HuskyAskPrompts suggestionTopicSelected="teams" onPromptItemClicked={mockOnPromptItemClicked} />);

    await waitFor(() => {
      expect(screen.getByText('Team A')).not.toBeNull();
    });

    fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'Non-existent' } });

    await waitFor(() => {
      expect(screen.getAllByText('No results found').length).toBeGreaterThan(0);
    });
  });

  // Additional tests for edge cases can be added here
});

