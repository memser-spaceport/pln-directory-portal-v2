import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackBody } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackBody/FeedbackBody';

describe('FeedbackBody', () => {
  it('fits element-pin crops in their tile and keeps screenshots cropped to fill', () => {
    render(
      <FeedbackBody
        text={
          '<p>See pins</p><p><img src="https://cdn.test/shot.png" alt="Screenshot"></p>' +
          '<p><img src="https://cdn.test/crop.webp" alt="Pin 1: Looks disabled" class="ai-app-pin-crop"></p>'
        }
        onImageClick={jest.fn()}
      />,
    );

    expect(screen.getByAltText('Pin 1: Looks disabled').closest('button')).toHaveClass('shotTilePinCrop');
    expect(screen.getByAltText('Screenshot').closest('button')).not.toHaveClass('shotTilePinCrop');
  });
});
