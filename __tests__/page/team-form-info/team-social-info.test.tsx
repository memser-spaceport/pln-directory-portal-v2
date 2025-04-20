import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSocialInfo from '@/components/page/team-form-info/team-social-info';

const mockProps = {
  errors: [],
  initialValues: {
    contactMethod: 'Email',
    website: 'https://example.com',
    linkedinHandler: 'https://linkedin.com/in/example',
    twitterHandler: '@example',
    telegramHandler: 'example_telegram',
    blog: 'https://blog.example.com',
  },
};

describe('TeamSocialInfo Component', () => {
  it('renders all fields with initial values', () => {
    render(<TeamSocialInfo {...mockProps} />);
    expect(screen.getByTestId('contact-method')).toHaveValue('Email');
    expect(screen.getByTestId('website')).toHaveValue('https://example.com');
    expect(screen.getByTestId('linkedinHandler')).toHaveValue('https://linkedin.com/in/example');
    expect(screen.getByTestId('twitterHandler')).toHaveValue('@example');
    expect(screen.getByTestId('telegramHandler')).toHaveValue('example_telegram');
    expect(screen.getByTestId('blog')).toHaveValue('https://blog.example.com');
  });

  it('renders empty fields if no initialValues are provided', () => {
    render(<TeamSocialInfo errors={[]} />);
    expect(screen.getByTestId('contact-method')).toHaveValue('');
    expect(screen.getByTestId('website')).toHaveValue('');
    expect(screen.getByTestId('linkedinHandler')).toHaveValue('');
    expect(screen.getByTestId('twitterHandler')).toHaveValue('');
    expect(screen.getByTestId('telegramHandler')).toHaveValue('');
    expect(screen.getByTestId('blog')).toHaveValue('');
  });

  it('displays errors when present', () => {
    const errorProps = { ...mockProps, errors: ['Error 1', 'Error 2'] };
    render(<TeamSocialInfo {...errorProps} />);
    const errorList = screen.getByTestId('team-social-errors');
    expect(errorList).toBeInTheDocument();
    expect(screen.getByTestId('team-social-error-0')).toHaveTextContent('Error 1');
    expect(screen.getByTestId('team-social-error-1')).toHaveTextContent('Error 2');
  });

  it('does not render error list if errors are empty', () => {
    render(<TeamSocialInfo {...mockProps} errors={[]} />);
    expect(screen.queryByTestId('team-social-errors')).not.toBeInTheDocument();
  });

  it('renders info tooltips for contact, website, and blog', () => {
    render(<TeamSocialInfo {...mockProps} />);
    expect(screen.getByText(/What is the best way for people to connect/i)).toBeInTheDocument();
    expect(screen.getByText(/Let us check out what you and your team do/i)).toBeInTheDocument();
    expect(screen.getByText(/Sharing your blog link allows us/i)).toBeInTheDocument();
  });
}); 