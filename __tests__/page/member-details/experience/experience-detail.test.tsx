// __tests__/page/member-details/experience/experience-detail.test.tsx
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import MemberDetailsExperienceDetail from '@/components/page/member-details/experience/experience-detail';
import * as EVENTS from '@/utils/constants';

// Mock child components
jest.mock('@/components/ui/popup-trigger-icon-button', () => {
  const Mock = (props: any) => (
    <button data-testid="edit-btn" onClick={() => props.callback && props.callback()}>{props.alt || 'edit'}</button>
  );
  Mock.displayName = 'MockPopupTriggerIconButton';
  return Mock;
});
jest.mock('@/components/page/member-details/experience/experience-description', () => {
  const Mock = (props: any) => (
    <div data-testid="desc">{props.description}</div>
  );
  Mock.displayName = 'MockExperienceDescription';
  return Mock;
});

const baseExperience = {
  title: 'Software Engineer',
  company: 'Protocol Labs',
  startDate: '2022-01-01T00:00:00.000Z',
  endDate: '2023-02-01T00:00:00.000Z',
  isCurrent: false,
  location: 'Remote',
  description: 'Worked on distributed systems.',
  uid: 'exp-1',
};

const member = { id: 'member-1', name: 'Alice' };
const userInfo = { id: 'user-1', name: 'Bob' };

describe('MemberDetailsExperienceDetail', () => {
  it('renders all experience details', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={baseExperience}
        isEditable={false}
        member={member}
        userInfo={userInfo}
      />
    );
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('January 2022 - February 2023')).toBeInTheDocument();
    expect(screen.getByText('1 year 2 months')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByTestId('desc')).toHaveTextContent('Worked on distributed systems.');
    // Image alt
    expect(screen.getByAltText('Protocol Labs')).toBeInTheDocument();
  });

  it('shows Present for current experience', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={{ ...baseExperience, isCurrent: true, endDate: undefined }}
        isEditable={false}
        member={member}
        userInfo={userInfo}
      />
    );
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it('renders edit button if isEditable', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={baseExperience}
        isEditable={true}
        member={member}
        userInfo={userInfo}
      />
    );
    expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
  });

  it('calls closeModal callback when edit is clicked', () => {
    const closeModal = jest.fn();
    render(
      <MemberDetailsExperienceDetail
        experience={baseExperience}
        isEditable={true}
        closeModal={closeModal}
        member={member}
        userInfo={userInfo}
      />
    );
    fireEvent.click(screen.getByTestId('edit-btn'));
    expect(closeModal).toHaveBeenCalled();
  });

  it('handles missing location and description gracefully', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={{ ...baseExperience, location: '', description: '' }}
        isEditable={false}
        member={member}
        userInfo={userInfo}
      />
    );
    // Should not render location or description
    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desc')).not.toBeInTheDocument();
  });

  it('handles missing endDate (current experience)', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={{ ...baseExperience, isCurrent: true, endDate: undefined }}
        isEditable={false}
        member={member}
        userInfo={userInfo}
      />
    );
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it('handles missing company for image alt', () => {
    render(
      <MemberDetailsExperienceDetail
        experience={{ ...baseExperience, company: '' }}
        isEditable={false}
        member={member}
        userInfo={userInfo}
      />
    );
    expect(screen.getByAltText('Experience')).toBeInTheDocument();
  });
});