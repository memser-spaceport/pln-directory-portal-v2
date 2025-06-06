import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyMemberExperience from '@/components/page/member-details/experience/empty-member-experience';

// Mock PopupTriggerIconButton
jest.mock('@/components/ui/popup-trigger-icon-button', () => {
  const PopupTriggerIconButton = (props: any) => (
    <button 
      data-testid="add-experience-btn"
      onClick={() => {
        // Simulate triggering the event
        const event = new CustomEvent(props.triggerEvent, { detail: props.data });
        document.dispatchEvent(event);
        if (props.analyticsData) {
          // Mock analytics call
          console.log('Analytics:', props.analyticsData);
        }
      }}
    >
      {props.label || 'Add'}
    </button>
  );
  PopupTriggerIconButton.displayName = 'PopupTriggerIconButton';
  return PopupTriggerIconButton;
});

// Mock constants
jest.mock('@/utils/constants', () => ({
  EVENTS: {
    TRIGGER_ADD_EDIT_EXPERIENCE_MODAL: 'trigger-add-edit-experience-modal'
  }
}));

const member = { 
  id: 'member-1', 
  name: 'Alice',
  uid: 'member-uid-1'
};

describe('EmptyMemberExperience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing event listeners
    document.removeEventListener('trigger-add-edit-experience-modal', jest.fn());
  });

  it('renders empty state message and add button', () => {
    render(<EmptyMemberExperience member={member} />);
    
   // Check for add button
    expect(screen.getByTestId('add-experience-btn')).toBeInTheDocument();
    expect(screen.getByText('Add Experience')).toBeInTheDocument();
  });

  it('triggers add experience modal when button is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('trigger-add-edit-experience-modal', eventListener);
    
    render(<EmptyMemberExperience member={member} />);
    
    const addBtn = screen.getByTestId('add-experience-btn');
    fireEvent.click(addBtn);
    
    // Check that event was triggered
    expect(eventListener).toHaveBeenCalledTimes(1);
    
    // Check event detail contains correct data
    const eventDetail = eventListener.mock.calls[0][0].detail;
    expect(eventDetail.experience).toEqual({
      memberId: member.id,
      title: '',
      company: '',
      startDate: expect.any(Date),
      endDate: expect.any(Date),
      isCurrent: false,
      location: '',
      uid: null,
    });
  });

  it('passes correct analytics data', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<EmptyMemberExperience member={member} />);
    
    const addBtn = screen.getByTestId('add-experience-btn');
    fireEvent.click(addBtn);
    
    // Check analytics data was logged (mocked)
    expect(consoleSpy).toHaveBeenCalledWith('Analytics:', {
      method: 'onAddExperienceClicked',
      user: undefined, // userInfo not passed in this component
      member: member
    });
    
    consoleSpy.mockRestore();
  });

  it('handles member with different id format', () => {
    const memberWithDifferentId = { 
      id: 'different-member-id', 
      name: 'Bob',
      uid: 'different-uid'
    };
    
    const eventListener = jest.fn();
    document.addEventListener('trigger-add-edit-experience-modal', eventListener);
    
    render(<EmptyMemberExperience member={memberWithDifferentId} />);
    
    const addBtn = screen.getByTestId('add-experience-btn');
    fireEvent.click(addBtn);
    
    const eventDetail = eventListener.mock.calls[0][0].detail;
    expect(eventDetail.experience.memberId).toBe('different-member-id');
  });

});
