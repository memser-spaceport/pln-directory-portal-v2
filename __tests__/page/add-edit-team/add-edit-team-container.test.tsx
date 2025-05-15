import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddEditTeamContainer from '@/components/page/add-edit-team/add-edit-team-container';

// Mock the dependent components
jest.mock('@/components/page/team-form-info/team-register-form', () => {
  return jest.fn(({ onSuccess, userInfo }) => (
    <div data-testid="mock-team-register-form">
      <span data-testid="user-email">{userInfo?.email || 'No email'}</span>
      <button data-testid="submit-success-button" onClick={onSuccess}>
        Simulate Success
      </button>
    </div>
  ));
});

jest.mock('@/components/core/form-step-indicator-mob', () => {
  return jest.fn(({ steps, defaultStep, uniqueKey, title, subTitle }) => (
    <div data-testid="mock-step-indicator-mob">
      <div data-testid="step-indicator-mob-steps">{steps.join(',')}</div>
      <div data-testid="step-indicator-mob-default">{defaultStep}</div>
      <div data-testid="step-indicator-mob-key">{uniqueKey}</div>
      <div data-testid="step-indicator-mob-title">{title}</div>
      <div data-testid="step-indicator-mob-subtitle">{subTitle}</div>
    </div>
  ));
});

jest.mock('@/components/core/form-step-indicator-web', () => {
  return {
    FormStepIndicatorWeb: jest.fn(({ steps, defaultStep, uniqueKey, title, subTitle }) => (
      <div data-testid="mock-step-indicator-web">
        <div data-testid="step-indicator-web-steps">{steps.join(',')}</div>
        <div data-testid="step-indicator-web-default">{defaultStep}</div>
        <div data-testid="step-indicator-web-key">{uniqueKey}</div>
        <div data-testid="step-indicator-web-title">{title}</div>
        <div data-testid="step-indicator-web-subtitle">{subTitle}</div>
      </div>
    ))
  };
});

jest.mock('@/components/page/add-edit-team/add-edit-team-success', () => {
  return jest.fn(() => (
    <div data-testid="mock-add-edit-team-success">Success Component</div>
  ));
});

describe('AddEditTeamContainer Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial form with step indicators', () => {
    render(<AddEditTeamContainer />);
    
    // Check if step indicators are rendered
    expect(screen.getByTestId('mock-step-indicator-mob')).toBeInTheDocument();
    expect(screen.getByTestId('mock-step-indicator-web')).toBeInTheDocument();
    
    // Check if team register form is rendered
    expect(screen.getByTestId('mock-team-register-form')).toBeInTheDocument();
    
    // Success component should not be visible initially
    expect(screen.queryByTestId('mock-add-edit-team-success')).not.toBeInTheDocument();
  });

  it('passes correct props to step indicators', () => {
    render(<AddEditTeamContainer />);
    
    // Expected values from the constants
    const expectedSteps = 'Basic,Team details,Social';
    const expectedDefaultStep = 'Basic';
    const expectedKey = 'submit-team';
    const expectedTitle = 'Submit a Team';
    const expectedSubtitle = 'Tell us about your team!';
    
    // Check mobile step indicator props
    expect(screen.getByTestId('step-indicator-mob-steps')).toHaveTextContent(expectedSteps);
    expect(screen.getByTestId('step-indicator-mob-default')).toHaveTextContent(expectedDefaultStep);
    expect(screen.getByTestId('step-indicator-mob-key')).toHaveTextContent(expectedKey);
    expect(screen.getByTestId('step-indicator-mob-title')).toHaveTextContent(expectedTitle);
    expect(screen.getByTestId('step-indicator-mob-subtitle')).toHaveTextContent(expectedSubtitle);
    
    // Check web step indicator props
    expect(screen.getByTestId('step-indicator-web-steps')).toHaveTextContent(expectedSteps);
    expect(screen.getByTestId('step-indicator-web-default')).toHaveTextContent(expectedDefaultStep);
    expect(screen.getByTestId('step-indicator-web-key')).toHaveTextContent(expectedKey);
    expect(screen.getByTestId('step-indicator-web-title')).toHaveTextContent(expectedTitle);
    expect(screen.getByTestId('step-indicator-web-subtitle')).toHaveTextContent(expectedSubtitle);
  });

  it('passes user email to TeamRegisterForm when provided', () => {
    const mockUserInfo = { email: 'test@example.com', name: 'Test User' };
    render(<AddEditTeamContainer userInfo={mockUserInfo} />);
    
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('shows no email when userInfo is not provided', () => {
    render(<AddEditTeamContainer />);
    
    expect(screen.getByTestId('user-email')).toHaveTextContent('No email');
  });

  it('shows success component when form submission is successful', async () => {
    render(<AddEditTeamContainer />);
    
    // Initially, success component should not be visible
    expect(screen.queryByTestId('mock-add-edit-team-success')).not.toBeInTheDocument();
    
    // Simulate successful form submission
    fireEvent.click(screen.getByTestId('submit-success-button'));
    
    // Success component should now be visible
    expect(screen.getByTestId('mock-add-edit-team-success')).toBeInTheDocument();
    
    // Form and step indicators should be hidden
    expect(screen.queryByTestId('mock-team-register-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-step-indicator-mob')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-step-indicator-web')).not.toBeInTheDocument();
  });

  it('renders with different team data when provided', () => {
    const mockTeam = { name: 'Test Team', id: '123' };
    render(<AddEditTeamContainer team={mockTeam} type="edit" />);
    
    // Should still render the form components
    expect(screen.getByTestId('mock-team-register-form')).toBeInTheDocument();
  });

  it('applies correct CSS classes for responsive design', () => {
    const { container } = render(<AddEditTeamContainer />);
    
    // Check main container class
    expect(container.querySelector('.add-edit-team')).toBeInTheDocument();
    
    // Check specific classes for responsiveness
    expect(container.querySelector('.add-edit-team__indicator--mobile')).toBeInTheDocument();
    expect(container.querySelector('.add-edit-team__indicator--web')).toBeInTheDocument();
    expect(container.querySelector('.add-edit-team__form-container')).toBeInTheDocument();
  });
}); 