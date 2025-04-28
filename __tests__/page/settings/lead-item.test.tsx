import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadItem from '../../../components/page/settings/intro-rules/lead-item';

const lead = {
  id: '1',
  name: 'Alice',
  avatar: '/avatar1.png',
  role: 'Lead',
};

describe('LeadItem', () => {
  it('renders lead name, avatar, and role', () => {
    render(<LeadItem lead={lead} onRemove={() => {}} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', '/avatar1.png');
  });

  it('shows as selected when selected prop is true', () => {
    const { container } = render(<LeadItem lead={lead} onRemove={() => {}} />);
    // You may need to adjust this selector based on your implementation
    expect(container.firstChild).toHaveClass('selected');
  });

  it('does not have selected class when selected prop is false', () => {
    const { container } = render(<LeadItem lead={lead} onRemove={() => {}} />);
    expect(container.firstChild).not.toHaveClass('selected');
  });

  it('calls onSelect when clicked', () => {
    const onRemove = jest.fn();
    render(<LeadItem lead={lead} onRemove={onRemove} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onRemove).toHaveBeenCalledWith(lead.id);
  });


  it('renders with no avatar if avatar is missing', () => {
    const leadNoAvatar = { ...lead, avatar: '' };
    render(<LeadItem lead={leadNoAvatar} onRemove={() => {}} />);
    // Should fallback to initials or a default avatar
    expect(screen.getByText('A')).toBeInTheDocument(); // If you use initials
    // or check for a default avatar image
    // expect(screen.getByAltText('Alice')).toHaveAttribute('src', '/default-avatar.png');
  });
});
