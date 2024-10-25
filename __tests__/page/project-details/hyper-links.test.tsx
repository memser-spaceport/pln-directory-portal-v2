import Hyperlinks from '@/components/page/project-details/hyper-links';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
describe('Hyperlinks Component', () => {
  let project: any = {};

  it('should render the title correctly', () => {
    project['projectLinks'] = [
      {
        url: 'https://www.google.com',
        name: 'Google',
      },
    ];
    render(<Hyperlinks project={project} user={{}} />);
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('should render the hyperlinks correctly', () => {
    project['projectLinks'] = [
      {
        url: 'https://www.google.com',
        name: 'Google',
      },
    ];
    render(<Hyperlinks project={project} user={{}} />);
    project.projectLinks.forEach((link: any, index: any) => {
      expect(screen.getByText(link.name)).toBeInTheDocument();
      expect(screen.getByText(link.name).closest('a')).toHaveAttribute('href', link.url);
    });
  });

  it('should handle an empty hyperlinks array correctly', () => {
    project.projectLinks = [];
    render(<Hyperlinks project={project} user={{}} />);
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.queryByText('https://www.google.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('should handle an empty project correctly', () => {
    project = {};
    render(<Hyperlinks project={project} user={{}} />);
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.queryByText('https://www.google.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('should navigate to the hyperlink correctly', () => {
    project['projectLinks'] = [
      {
        url: 'https://www.google.com',
        name: 'Google',
      },
    ];
    render(<Hyperlinks project={project} user={{}} />);
    project.projectLinks.forEach((link: any, index: any) => {
      expect(screen.getByText(link.name)).toBeInTheDocument();
      const linkElement = screen.getByText(link.name).closest('a');
      expect(linkElement).toHaveAttribute('href', link.url);
      if (linkElement) {
        userEvent.click(linkElement);
      }
    });
  });
});
