import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllContributorsModal from '@/components/page/project-details/all-contributors-modal';
import { EVENTS } from '@/utils/constants';

describe('AllContributorsModal', () => {
  const onCloseMock = jest.fn();
  const onContributorClickHandlerMock = jest.fn();

  let contributorsList = [
    { id: 1, name: 'Contributor 1', logo: '/path/to/logo1.png', teamLead: true },
    { id: 2, name: 'Contributor 2', logo: '/path/to/logo2.png', teamLead: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with contributors list', () => {
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    expect(screen.getByText('Contributors (2)')).toBeInTheDocument();
    expect(screen.getByText('Contributor 1')).toBeInTheDocument();
    expect(screen.getByText('Contributor 2')).toBeInTheDocument();
  });

  it('should call onClose when modal is closed', () => {
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    const closeButton = screen.getByAltText('close');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should filter contributors list based on search term', () => {
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'Contributor 1' } });

    expect(screen.getByText('Contributor 1')).toBeInTheDocument();
    expect(screen.queryByText('Contributor 2')).not.toBeInTheDocument();
  });

  it('should call onContributorClickHandler when a contributor is clicked', () => {
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    const contributor = screen.getByText('Contributor 1');
    fireEvent.click(contributor);

    expect(onContributorClickHandlerMock).toHaveBeenCalledWith(contributorsList[0]);
  });

  it('should render default logo when logo is empty', () => {
    contributorsList = [
      { id: 1, name: 'Contributor 1', logo: '', teamLead: true },
      { id: 2, name: 'Contributor 2', logo: '/path/to/logo2.png', teamLead: false },
    ];
    const { container } = render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);
    const targetImage = container.querySelector('img[src="/icons/default_profile.svg"]');
    expect(targetImage).toBeInTheDocument();
  });

  it('should trigger custom event when modal is opened', async () => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    const showModalEvent = new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: true });
    await act(async () => {
      document.dispatchEvent(showModalEvent);
    });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('should trigger custom event when modal is closed', async () => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    render(<AllContributorsModal onClose={onCloseMock} contributorsList={contributorsList} onContributorClickHandler={onContributorClickHandlerMock} />);

    const closeModalEvent = new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: false });
    await act(async () => {
      document.dispatchEvent(closeModalEvent);
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
