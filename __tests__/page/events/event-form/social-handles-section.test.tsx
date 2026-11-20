import '@testing-library/jest-dom';
import { act, fireEvent, screen, within } from '@testing-library/react';

import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { SocialHandlesSection } from '@/components/page/events/event-form/SocialHandlesSection';
import { WebsiteSection } from '@/components/page/events/event-form/WebsiteSection';

/* The edit page's website link and social handle rows, against the form's `websiteUrl` and `socialHandles`. */

const rows = () => within(screen.getByRole('list', { name: 'Social handles' })).getAllByRole('listitem');

describe('SocialHandlesSection', () => {
  it('shows one empty row for an empty list and writes nothing until the person types', () => {
    const { form } = renderSection(<SocialHandlesSection />, { variant: 'edit' });

    expect(screen.getByText('Social Handles')).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
    expect(form.current.getValues('socialHandles')).toEqual([]);
    const platform = screen.getByLabelText('Social platform 1') as HTMLSelectElement;
    expect(Array.from(platform.options).map((option) => option.text)).toEqual([
      'Select platform',
      'Twitter',
      'Discord',
      'Bluesky',
      'Mastodon',
      'Telegram',
      'Email',
    ]);

    fireEvent.change(screen.getByPlaceholderText('Enter your handle'), { target: { value: '@plabs' } });
    fireEvent.change(platform, { target: { value: 'twitter' } });

    expect(form.current.getValues('socialHandles')).toEqual([{ platform: 'twitter', handle: '@plabs' }]);
  });

  it('adds a row with "Add More" and removes the row whose remove control is pressed', () => {
    const { form } = renderSection(<SocialHandlesSection />, {
      variant: 'edit',
      values: { socialHandles: [{ platform: 'twitter', handle: '@plabs' }] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add More' }));
    expect(rows()).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Social handle 2'), { target: { value: 'events@pl.xyz' } });
    fireEvent.change(screen.getByLabelText('Social platform 2'), { target: { value: 'email' } });

    fireEvent.click(screen.getByRole('button', { name: 'Remove social handle 1' }));

    expect(rows()).toHaveLength(1);
    expect(form.current.getValues('socialHandles')).toEqual([{ platform: 'email', handle: 'events@pl.xyz' }]);
    expect(screen.getByLabelText('Social handle 1')).toHaveValue('events@pl.xyz');
  });

  it('shows a row message on the wrong row only and clears it when that row changes', async () => {
    const { form } = renderSection(<SocialHandlesSection />, {
      variant: 'edit',
      values: {
        socialHandles: [
          { platform: 'twitter', handle: '@plabs' },
          { platform: '', handle: 'plabs' },
        ],
      },
    });
    act(() => form.current.setError('socialHandles.1.handle', { type: 'manual', message: 'Please select a platform' }));

    expect(await within(rows()[1]).findByText('Please select a platform')).toBeInTheDocument();
    expect(within(rows()[0]).queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Social platform 2'), { target: { value: 'discord' } });

    expect(screen.queryByText('Please select a platform')).not.toBeInTheDocument();
  });
});

describe('WebsiteSection', () => {
  it('writes the website link and shows its message', async () => {
    const { form } = renderSection(<WebsiteSection />, { variant: 'edit' });

    fireEvent.change(screen.getByLabelText('Website Link'), { target: { value: 'example.com' } });
    expect(screen.getByPlaceholderText('Enter Website Link')).toHaveValue('example.com');
    expect(form.current.getValues('websiteUrl')).toBe('example.com');

    act(() => form.current.setError('websiteUrl', { type: 'manual', message: 'Enter a valid website link' }));
    expect(await screen.findByText('Enter a valid website link')).toBeInTheDocument();
  });
});
