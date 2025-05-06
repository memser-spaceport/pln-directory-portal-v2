import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HostSpeakersList from '@/components/page/events/hosts-speakers-list';

// Mock Modal and Image (Next.js)
jest.mock('@/components/core/modal', () => (props: any) => {
  // Create a ref callback to attach showModal/close to the dialog
  const setRef = (node: any) => {
    if (node) {
      node.showModal = node.showModal || (() => {});
      node.close = node.close || (() => {});
      if (props.modalRef) {
        props.modalRef.current = node;
      }
    }
  };
  return (
    <dialog data-testid="modal-dialog" ref={setRef}>
      <button data-testid="modal-close" onClick={props.onClose}>Close</button>
      {props.children}
    </dialog>
  );
});
jest.mock('next/image', () => (props: any) => <img {...props} />);

// Mock analytics
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({})
}));

// Mock constants
jest.mock('@/utils/constants', () => ({
  EVENTS: { PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE: 'test-event' }
}));

describe('HostSpeakersList', () => {
  const contributorsList = [
    {
      uid: '1',
      member: { name: 'Alice', image: { url: '/alice.png' } },
    },
    {
      uid: '2',
      member: { name: 'Bob', image: { url: '/bob.png' } },
    },
    {
      uid: '3',
      member: { name: 'Charlie', image: { url: '' } },
    },
  ];
  const onClose = jest.fn();
  const onContributorClickHandler = jest.fn();

  const baseProps = {
    onClose,
    contributorsList,
    onContributorClickHandler,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal and header with contributors count', () => {
    render(<HostSpeakersList {...baseProps} />);
    expect(screen.getByTestId('modal-dialog')).toBeInTheDocument();
    expect(screen.getByText('Contributors (3)')).toBeInTheDocument();
  });

  it('renders all contributors', () => {
    render(<HostSpeakersList {...baseProps} />);
    expect(screen.getByTestId('contributor-1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('contributor-2')).toHaveTextContent('Bob');
    expect(screen.getByTestId('contributor-3')).toHaveTextContent('Charlie');
  });

  it('calls onContributorClickHandler when a contributor is clicked', () => {
    render(<HostSpeakersList {...baseProps} />);
    fireEvent.click(screen.getByTestId('contributor-2'));
    expect(onContributorClickHandler).toHaveBeenCalledWith(contributorsList[1]);
  });

  it('shows default image if contributor image is missing', () => {
    render(<HostSpeakersList {...baseProps} />);
    const img = screen.getByTestId('contributor-3').querySelector('img');
    expect(img).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  it('filters contributors by search', () => {
    render(<HostSpeakersList {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(screen.getByTestId('contributor-2')).toBeInTheDocument();
    expect(screen.queryByTestId('contributor-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contributor-3')).not.toBeInTheDocument();
  });

  it('shows no contributors found if search yields nothing', () => {
    render(<HostSpeakersList {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Zoe' } });
    expect(screen.getByTestId('no-contributors')).toBeInTheDocument();
  });

  it('clears search when clear icon is clicked', () => {
    render(<HostSpeakersList {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(screen.getByTestId('contributor-2')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('clear-search'));
    expect(input).toHaveValue('');
    expect(screen.getByTestId('contributor-1')).toBeInTheDocument();
    expect(screen.getByTestId('contributor-2')).toBeInTheDocument();
    expect(screen.getByTestId('contributor-3')).toBeInTheDocument();
  });

  it('calls onClose and resets state when modal close handler is called', () => {
    render(<HostSpeakersList {...baseProps} />);
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders correctly with empty contributorsList', () => {
    render(<HostSpeakersList {...baseProps} contributorsList={[]} />);
    expect(screen.getByText('Contributors (0)')).toBeInTheDocument();
    expect(screen.getByTestId('no-contributors')).toBeInTheDocument();
  });

  it('calls showModal when event detail is true', () => {
    const { getByTestId } = render(<HostSpeakersList {...baseProps} />);
    const dialog = getByTestId("modal-dialog");

    const showModalSpy = jest.spyOn(dialog as HTMLDialogElement, "showModal");
    fireEvent(
      document,
      new CustomEvent("test-event", {
        detail: true,
      })
    );
    expect(showModalSpy).toHaveBeenCalled();
    showModalSpy.mockRestore();
  });

  it('calls close when event detail is false', () => {
    const { getByTestId } = render(<HostSpeakersList {...baseProps} />);
    const dialog = getByTestId("modal-dialog");

    const closeSpy = jest.spyOn(dialog as HTMLDialogElement, "close");
    fireEvent(
      document,
      new CustomEvent("test-event", {
        detail: false,
      })
    );
    expect(closeSpy).toHaveBeenCalled();
    closeSpy.mockRestore();
  });

  it('resets filtered list when search is whitespace', () => {
    render(<HostSpeakersList {...baseProps} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByTestId('contributor-1')).toBeInTheDocument();
    expect(screen.getByTestId('contributor-2')).toBeInTheDocument();
    expect(screen.getByTestId('contributor-3')).toBeInTheDocument();
  });
}); 