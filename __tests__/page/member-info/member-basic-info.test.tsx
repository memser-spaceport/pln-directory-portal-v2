import { render, screen, fireEvent } from '@testing-library/react';
import MemberBasicInfo from '@/components/page/member-info/member-basic-info';

describe('MemberBasicInfo Component', () => {
  const initialValues = {
    imageFile: '',
    name: 'John Doe',
    email: 'john@example.com',
    plnStartDate: '2023-01-01',
    city: 'New York',
    region: 'NY',
    country: 'USA',
  };

  const setup = (props = {}) => {
    const defaultProps = {
      errors: [],
      initialValues,
      ...props,
    };
    return render(<MemberBasicInfo {...defaultProps} />);
  };

  test('renders without crashing', () => {
    setup();
    // Check if the component renders correctly
    expect(screen.getByTestId('member-basic-info')).not.toBeNull();
  });

  test('displays errors when provided', () => {
    setup({ errors: ['Error 1', 'Error 2'] });
    // Check if errors are displayed
    expect(screen.getByText('Error 1')).not.toBeNull();
    expect(screen.getByText('Error 2')).not.toBeNull();
  });

});

