import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { EventImage } from '@/components/page/events/EventImage/EventImage';
import { GoingPill } from '@/components/page/events/GoingPill/GoingPill';

/* LAB-3247 (task 1.5): the two pieces ported from prototypes/entries/events-shared. */

it('GoingPill says Going with its tick, or the sentence a place needs', () => {
  const { container, rerender } = render(<GoingPill />);
  expect(screen.getByText('Going')).toBeInTheDocument();
  expect(container.querySelector('[data-going]')).not.toBeNull();
  rerender(<GoingPill label="You're going" />);
  expect(screen.getByText("You're going")).toBeInTheDocument();
});

it('EventImage draws the picture, or the brand placeholder without one', () => {
  const { container, rerender } = render(<EventImage src="https://img/a.png" className="x" />);
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://img/a.png');
  rerender(<EventImage src={null} className="x" />);
  expect(container.querySelector('img')).toBeNull();
  expect(screen.getByTestId('event-image-placeholder')).toHaveClass('x');
});
