import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ExperienceDescription from '@/components/page/member-details/experience/experience-description';

describe('ExperienceDescription', () => {
  it('renders the description sanitized, without waiting for an effect', () => {
    const { container } = render(
      <ExperienceDescription
        description={'<p>Led <a href="javascript:alert(1)">growth</a></p><img src=x onerror=alert(1)>'}
      />,
    );
    expect(screen.getByText('growth')).not.toHaveAttribute('href');
    expect(container.querySelector('img')?.hasAttribute('src')).toBe(false);
  });

  it('clips a long description and shows the rest on "Show more"', () => {
    const long = `<p>${'word '.repeat(80)}end-marker</p>`;
    render(<ExperienceDescription description={long} />);
    expect(screen.queryByText(/end-marker/)).toBeNull();
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText(/end-marker/)).toBeInTheDocument();
    expect(screen.queryByText('Show more')).toBeNull();
  });
});
