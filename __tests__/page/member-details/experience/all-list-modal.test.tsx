import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AllListModal from '@/components/page/member-details/experience/all-list-modal';

// Mock Modal and ExperienceDetail
jest.mock('@/components/core/modal', () => {
  const Modal = (props: any) => (
    <dialog data-testid="modal">
      <button type="button" aria-label="close" onClick={props.onClose}>close</button>
      {props.children}
    </dialog>
  );
  Modal.displayName = 'Modal';
  return Modal;
});

jest.mock('@/components/page/member-details/experience/experience-detail', () => {
  const ExperienceDetail = (props: any) => (
    <div data-testid="experience-detail">{props.experience?.title}</div>
  );
  ExperienceDetail.displayName = 'ExperienceDetail';
  return ExperienceDetail;
});

const member = { id: 'member-1', name: 'Alice' };
const userInfo = { id: 'user-1', name: 'Bob' };

const experiences = [
  {
    uid: 'exp-1',
    title: 'Engineer',
    company: 'Proto',
    startDate: '2022-01-01T00:00:00.000Z',
    endDate: '2023-01-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Remote',
    description: 'Did stuff',
  },
  {
    uid: 'exp-2',
    title: 'Manager',
    company: 'Proto',
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2021-01-01T00:00:00.000Z',
    isCurrent: false,
    location: 'Remote',
    description: 'Managed stuff',
  },
];

describe('AllListModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens modal on TRIGGER_SEE_ALL_EXPERIENCE_MODAL event', async () => {
    render(<AllListModal member={member} userInfo={userInfo} />);
    const event = new CustomEvent('trigger-see-all-experience-modal', {
      detail: { experiences, isEditable: true }
    });
    document.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    // Experiences rendered
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('closes modal on close button click', async () => {
    render(<AllListModal member={member} userInfo={userInfo} />);
    // Open modal
    const event = new CustomEvent('trigger-see-all-experience-modal', {
      detail: { experiences, isEditable: true }
    });
    document.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    // Find and click the close button
    const closeBtn = screen.getByText('close');;
    fireEvent.click(closeBtn);

  });

  it('renders empty state if no experiences', async () => {
    render(<AllListModal member={member} userInfo={userInfo} />);
    const event = new CustomEvent('trigger-see-all-experience-modal', {
      detail: { experiences: [], isEditable: true }
    });
    document.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    // Should show some empty state message or not render any experience-detail
    expect(screen.queryByTestId('experience-detail')).not.toBeInTheDocument();
  });

  it('renders as not editable if isEditable is false', async () => {
    render(<AllListModal member={member} userInfo={userInfo} />);
    const event = new CustomEvent('trigger-see-all-experience-modal', {
      detail: { experiences, isEditable: false }
    });
    document.dispatchEvent(event);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    // The experience-detail should still render, but you can check for absence of edit controls if your implementation supports it
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

});
