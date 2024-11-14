import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import HuskyChatSuggestions from '../../../components/core/husky/husky-chat-suggestion';
import '@testing-library/jest-dom';

describe('HuskyChatSuggestions', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<HuskyChatSuggestions followupQuestions={[]} isAnswerLoading={false} />);
    // Check if the title is rendered
    expect(screen.getByTestId('suggestions-title')).toBeInTheDocument();
  });

  it('displays follow-up questions', () => {
    const questions = ['Question 1', 'Question 2'];
    render(<HuskyChatSuggestions followupQuestions={questions} isAnswerLoading={false} />);
    // Check if questions are rendered
    questions.forEach((question, index) => {
      expect(screen.getByTestId(`follow-up-question-${index}`)).toHaveTextContent(question);
    });
  });

  it('calls onFollowupClicked when a question is clicked', async () => {
    // Properly mock the async function
    const mockFollowupClicked = jest.fn().mockResolvedValue(undefined); // Mocking a resolved promise

    render(<HuskyChatSuggestions followupQuestions={['Question 1']} onFollowupClicked={mockFollowupClicked} isAnswerLoading={false} />);
    fireEvent.click(screen.getByTestId('follow-up-question-0'));
    
    // Check if the mock function was called with the correct argument
    expect(mockFollowupClicked).toHaveBeenCalledWith('Question 1');
  });

  it('does not call onFollowupClicked when answer is loading', () => {
    const mockFollowupClicked = jest.fn(); // Mock function

    render(<HuskyChatSuggestions followupQuestions={['Question 1']} onFollowupClicked={mockFollowupClicked} isAnswerLoading={true} />);
    fireEvent.click(screen.getByTestId('follow-up-question-0'));
    
    // Ensure the mock function was not called
    expect(mockFollowupClicked).not.toHaveBeenCalled();
  });

});
