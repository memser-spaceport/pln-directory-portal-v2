// header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import Header from '@/components/page/project-details/header';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/analytics/project.analytics', () => ({
  useProjectAnalytics: () => ({
    onProjectDeleteBtnClicked: jest.fn(),
    onProjectDeleteCancelBtnClicked: jest.fn(),
    onProjectDetailEditClicked: jest.fn(),
    onProjectDeleteConfirmBtnClicked: jest.fn(),
    onProjectDeleteSuccess: jest.fn(),
    onProjectDeleteFailed: jest.fn(),
  }),
}));

jest.mock('@/services/projects.service', () => ({
  deleteProject: jest.fn().mockResolvedValue({ status: 200 }),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
}));

describe('Header Component', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const defaultProps = {
    project: {
      id: '1',
      name: 'Test Project',
      tagline: 'Test Tagline',
      logo: '/test-logo.png',
      lookingForFunding: true,
      isDeleted: false,
    },
    userHasDeleteRights: true,
    userHasEditRights: true,
    user: { uid: 'user1' },
    authToken: 'test-token',
  };

  it('renders without crashing', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getAllByText('Test Project').length).toBe(2);
    expect(screen.getByText('Test Tagline')).toBeInTheDocument();
    expect(screen.getByAltText('logo')).toHaveAttribute('src', '/test-logo.png');
  });

//   it('displays edit and delete buttons based on user rights', () => {
//     render(<Header {...defaultProps} />);
//     expect(screen.getByText('Edit')).toBeInTheDocument();
//     expect(screen.getByText('Delete')).toBeInTheDocument();
//   });

//   it('calls onEditProject when edit button is clicked', () => {
//     render(<Header {...defaultProps} />);
//     fireEvent.click(screen.getByText('Edit'));
//     expect(mockRouter.push).toHaveBeenCalledWith('/projects/update/1');
//   });

//   it('opens and closes delete confirmation modal', () => {
//     render(<Header {...defaultProps} />);
//     fireEvent.click(screen.getByText('Delete'));
//     expect(screen.getByText('Are you sure you want to delete this project?')).toBeInTheDocument();
//     fireEvent.click(screen.getByText('Cancel'));
//     expect(screen.queryByText('Are you sure you want to delete this project?')).not.toBeInTheDocument();
//   });

//   it('calls onDeleteProject when delete is confirmed', async () => {
//     render(<Header {...defaultProps} />);
//     fireEvent.click(screen.getByText('Delete'));
//     fireEvent.click(screen.getByText('Confirm'));
//     expect(await screen.findByText('Project deleted successfully.')).toBeInTheDocument();
//     expect(mockRouter.push).toHaveBeenCalledWith('/projects');
//     expect(mockRouter.refresh).toHaveBeenCalled();
//   });
});
