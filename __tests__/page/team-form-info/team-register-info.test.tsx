import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamRegisterInfo from '@/components/page/team-form-info/team-register-info';

// Test suite for TeamRegisterInfo component
// Covers rendering, text content, and structure

describe('TeamRegisterInfo Component', () => {
  it('renders without crashing', () => {
    render(<TeamRegisterInfo />);
    // Main container should be present
    expect(screen.getByText('Submit a Team')).toBeInTheDocument();
    expect(screen.getByText('Tell us about your team!')).toBeInTheDocument();
  });
}); 