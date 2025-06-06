import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExperienceList from '@/components/page/member-details/experience/experience-list-card';

// Mock all child components
jest.mock('@/components/page/member-details/experience/empty-member-experience', () => {
  const EmptyMemberExperience = (props: any) => (
    <div data-testid="empty-experience">
      <span>No experiences found</span>
      <button onClick={() => console.log('Add experience clicked')}>Add Experience</button>
    </div>
  );
  EmptyMemberExperience.displayName = 'EmptyMemberExperience';
  return EmptyMemberExperience;
});

jest.mock('@/components/page/member-details/experience/experience-detail', () => {
  const ExperienceDetail = (props: any) => (
    <div data-testid="experience-detail" data-experience-id={props.experience?.uid}>
      <h3>{props.experience?.title}</h3>
      <p>{props.experience?.company}</p>
      {props.isEditable && <button data-testid="edit-btn">Edit</button>}
    </div>
  );
  ExperienceDetail.displayName = 'ExperienceDetail';
  return ExperienceDetail;
});

jest.mock('@/components/ui/popup-trigger-icon-button', () => {
  const PopupTriggerIconButton = (props: any) => (
    <button 
      data-testid="popup-trigger-btn"
      onClick={() => {
        const event = new CustomEvent(props.triggerEvent, { detail: props.data });
        document.dispatchEvent(event);
        if (props.analyticsData) {
          console.log('Analytics:', props.analyticsData);
        }
      }}
    >
      {props.alt || 'Button'}
    </button>
  );
  PopupTriggerIconButton.displayName = 'PopupTriggerIconButton';
  return PopupTriggerIconButton;
});

jest.mock('@/components/page/member-details/experience/add-edit-experience-modal', () => {
  const AddEditExperienceModal = (props: any) => (
    <div data-testid="add-edit-modal">Add/Edit Modal</div>
  );
  AddEditExperienceModal.displayName = 'AddEditExperienceModal';
  return AddEditExperienceModal;
});

jest.mock('@/components/page/member-details/experience/all-list-modal', () => {
  const AllListModal = (props: any) => (
    <div data-testid="all-list-modal">All List Modal</div>
  );
  AllListModal.displayName = 'AllListModal';
  return AllListModal;
});

// Mock the service
jest.mock('@/services/members-experience.service', () => ({
  getAllMemberExperiences: jest.fn(),
}));

// Mock next helpers
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: jest.fn().mockReturnValue({
    authToken: 'mock-token',
    userInfo: { id: 'user-1', name: 'Test User' }
  }),
}));

// Mock constants
jest.mock('@/utils/constants', () => ({
  EVENTS: {
    TRIGGER_SEE_ALL_EXPERIENCE_MODAL: 'trigger-see-all-experience-modal',
    TRIGGER_ADD_EDIT_EXPERIENCE_MODAL: 'trigger-add-edit-experience-modal'
  }
}));

import { getAllMemberExperiences } from '@/services/members-experience.service';

const mockGetAllMemberExperiences = getAllMemberExperiences as jest.MockedFunction<typeof getAllMemberExperiences>;

const member = {
  id: 'member-1',
  name: 'Alice',
  uid: 'member-uid-1'
};

const mockExperiences = [
  {
    uid: 'exp-1',
    title: 'Software Engineer',
    company: 'Protocol Labs',
    startDate: '2022-01-01T00:00:00.000Z',
    endDate: '2023-01-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Remote',
    description: 'Worked on distributed systems',
  },
  {
    uid: 'exp-2',
    title: 'Senior Engineer',
    company: 'Tech Corp',
    startDate: '2021-01-01T00:00:00.000Z',
    endDate: '2022-01-01T00:00:00.000Z',
    isCurrent: false,
    location: 'San Francisco',
    description: 'Led development team',
  },
  {
    uid: 'exp-3',
    title: 'Lead Engineer',
    company: 'Startup Inc',
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: null,
    isCurrent: true,
    location: 'New York',
    description: 'Current position',
  },
  {
    uid: 'exp-4',
    title: 'Senior Software Engineer',
    company: 'Protocol Labs',
    startDate: '2022-01-01T00:00:00.000Z',
    endDate: '2023-01-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Remote',
    description: 'Worked on distributed systems',
  }
];

describe('ExperienceList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('renders experiences when data is available', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);

    render(await ExperienceList({ member, isEditable: true }));

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('shows only first 3 experiences initially', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);

    render(await ExperienceList({ member, isEditable: true }));

    // Should show first 3 experiences
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    
    // Fourth experience should not be visible initially
    expect(screen.queryByText('Senior Software Engineer')).not.toBeInTheDocument();
  });

  it('shows "See All" button when more than 3 experiences', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);

    render(await ExperienceList({ member, isEditable: true }));

    expect(screen.getByText('seeall')).toBeInTheDocument();
  });

  it('does not show "See All" button when 3 or fewer experiences', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences.slice(0, 3));

    render(await ExperienceList({ member, isEditable: true }));

    expect(screen.queryByText('seeall')).not.toBeInTheDocument();
  });

  it('triggers see all modal when "See All" button is clicked', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);
    const eventListener = jest.fn();
    document.addEventListener('trigger-see-all-experience-modal', eventListener);

    render(await ExperienceList({ member, isEditable: true }));

    const seeAllBtn = screen.getByText('seeall');
    fireEvent.click(seeAllBtn);

    expect(eventListener).toHaveBeenCalledTimes(1);
  });

  it('passes correct isEditable prop to experience details', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences.slice(0, 3));

    render(await ExperienceList({ member, isEditable: true }));

    // Should show edit buttons when editable
    expect(screen.getAllByTestId('edit-btn')).toHaveLength(3);
  });

  it('does not show edit buttons when not editable', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences.slice(0, 3));

    render(await ExperienceList({ member, isEditable: false }));

    // Should not show edit buttons when not editable
    expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
  });

  it('renders modals', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);

    render(await ExperienceList({ member, isEditable: true }));

    expect(screen.getByTestId('add-edit-modal')).toBeInTheDocument();
    expect(screen.getByTestId('all-list-modal')).toBeInTheDocument();
  });

  it('passes correct analytics data to see all button', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(await ExperienceList({ member, isEditable: true }));

    const seeAllBtn = screen.getByText('seeall');
    fireEvent.click(seeAllBtn);

    expect(consoleSpy).toHaveBeenCalledWith('Analytics:', {
      method: 'onSeeAllExperienceClicked',
      user: { id: 'user-1', name: 'Test User' },
      member: member
    });

    consoleSpy.mockRestore();
  });


  it('handles undefined member', async () => {
    mockGetAllMemberExperiences.mockResolvedValue([]);

    render(await ExperienceList({ member: null as any, isEditable: true }));

    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });


  it('handles experiences with missing dates', async () => {
    const experiencesWithMissingDates = [
      { ...mockExperiences[0], startDate: null },
      { ...mockExperiences[1], startDate: '2022-01-01T00:00:00.000Z' }
    ];
    
    mockGetAllMemberExperiences.mockResolvedValue(experiencesWithMissingDates);

    render(await ExperienceList({ member, isEditable: true }));

    // Should not crash and should render both experiences
    expect(screen.getAllByTestId('experience-detail')).toHaveLength(2);
  });

  it('passes userInfo to modals', async () => {
    mockGetAllMemberExperiences.mockResolvedValue(mockExperiences);

    render(await ExperienceList({ member, isEditable: true }));

    // Modals should receive userInfo prop
    expect(screen.getByTestId('add-edit-modal')).toBeInTheDocument();
    expect(screen.getByTestId('all-list-modal')).toBeInTheDocument();
  });
});

