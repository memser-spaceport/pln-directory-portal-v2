import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmationModal from '@/components/page/project-details/delete-confirmation-modal';

describe('DeleteConfirmationModal', () => {
  const onClose = jest.fn();
  const onDeleteProject = jest.fn();
  it('should render the header correctly', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });
  it('should render the body correctly', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    expect(screen.getByText('Are you sure you want to delete the project?')).toBeInTheDocument();
  });

  it('should render the cancel button correctly', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render the confirm button correctly', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    const cancelButton = screen.getByText('Cancel');
    cancelButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onDeleteProject when confirm button is clicked', () => {
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    const confirmButton = screen.getByText('Confirm');
    confirmButton.click();
    expect(onDeleteProject).toHaveBeenCalledTimes(1);
  });

  it('should add event listener on mount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'project-detail-delete-modal-open-and-close',
      expect.any(Function)
    );
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<DeleteConfirmationModal onClose={onClose} onDeleteProject={onDeleteProject} />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'project-detail-delete-modal-open-and-close',
      expect.any(Function)
    );
  });
  
});
