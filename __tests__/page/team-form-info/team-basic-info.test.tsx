// team-basic-info.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamBasicInfo from '@/components/page/team-form-info/team-basic-info';

const mockProps = {
  errors: [],
  initialValues: {
    requestorEmail: 'test@example.com',
    name: 'Team Name',
    shortDescription: 'Short description here',
    longDescription: 'Long description here',
    officeHours: '9 AM - 5 PM',
  },
  isEdit: false,
  longDesc: 'Long description here',
  setLongDesc: jest.fn(),
};

describe('TeamBasicInfo Component', () => {
  test('renders without crashing', () => {
    render(<TeamBasicInfo {...mockProps} />);
    expect(screen.getByText("Requestor's email*")).toBeInTheDocument();
  });

  test('displays errors when present', () => {
    const errorProps = { ...mockProps, errors: ['Error 1', 'Error 2'] };
    render(<TeamBasicInfo {...errorProps} />);
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('displays the requestor email field when isEdit is false', () => {

    const mockProps = {
      errors: [],
      initialValues: {
        requestorEmail: 'test@example.com',
        name: 'Team Name',
        shortDescription: 'Short description here',
        longDescription: 'Long description here',
        officeHours: '9 AM - 5 PM',
        imageFile: '',
      },
      longDesc: 'Long description here',
      setLongDesc: jest.fn(),
    };

    render(<TeamBasicInfo {...mockProps} />);
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
  });

  it('does not display the requestor email field when isEdit is true', () => {
    render(<TeamBasicInfo {...mockProps} isEdit={true} />);
    expect(screen.queryByPlaceholderText('Enter your email address')).not.toBeInTheDocument();
  });

  it('renders the profile image if provided', () => {
    const propsWithImage = {
      ...mockProps,
      initialValues: {
        ...mockProps.initialValues,
        imageFile: 'image-url.jpg',
      },
    };
    render(<TeamBasicInfo {...propsWithImage} />);
    expect(screen.getByAltText('team profile')).toBeInTheDocument();
  });


  it('should handle image upload correctly', async () => {
    render(<TeamBasicInfo {...mockProps} />);
    const fileInput = screen.getByTestId('team-image-upload');
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('team profile')).toBeInTheDocument();
    });
  });
  
  it('should delete image correctly', async () => {
    render(<TeamBasicInfo {...mockProps} />);
    const fileInput = screen.getByTestId('team-image-upload');
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const deleteButton = screen.getByTitle('Delete profile image');
      fireEvent.click(deleteButton);
      expect(screen.queryByAltText('team profile')).not.toBeInTheDocument();
    });
  });

  it('should reset the image input and profile image correctly', async () => {
    render(<TeamBasicInfo {...mockProps} />);
    
    // Simulate image upload
    const fileInput = screen.getByTestId('team-image-upload');
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
  
    await waitFor(() => {
      expect(screen.getByAltText('team profile')).toBeInTheDocument();
    });
  
    // Call the resetHandler function
    fireEvent(
      document,
      new CustomEvent('reset-team-register-form')
    );
    
    // Verify the image input and profile image are reset
    await waitFor(() => {
      expect((fileInput as HTMLInputElement).value).toBe('');
      expect(screen.queryByAltText('team profile')).not.toBeInTheDocument();
    });
  });
});
