// header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import Header from '@/components/page/project-details/header';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
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

  it('displays edit and delete buttons based on user rights', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onEditProject when edit button is clicked', () => {
    render(<Header {...defaultProps} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(mockRouter.push).toHaveBeenCalledWith('/projects/update/1');
  });
});
