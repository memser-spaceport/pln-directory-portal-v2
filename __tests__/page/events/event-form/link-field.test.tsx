import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { RegistrationSection } from '@/components/page/events/event-form/RegistrationSection';

/* The registration link: the length cap, "https://" on leaving the field, and the check while typing. */

const field = () => screen.getByPlaceholderText('Enter Registration Link');

describe('LinkField (registration link)', () => {
  it('takes at most 2048 characters', () => {
    renderSection(<RegistrationSection />);
    expect(field()).toHaveAttribute('maxLength', '2048');
  });

  it('puts "https://" in front of an address with no scheme on leaving the field', async () => {
    const { form } = renderSection(<RegistrationSection />);

    fireEvent.change(field(), { target: { value: 'lu.ma/abc' } });
    fireEvent.blur(field());

    await waitFor(() => expect(form.current.getValues('registrationUrl')).toBe('https://lu.ma/abc'));
    expect(screen.queryByText('Enter a valid registration link')).not.toBeInTheDocument();
  });

  it('keeps an address that already has a scheme', async () => {
    const { form } = renderSection(<RegistrationSection />);

    fireEvent.change(field(), { target: { value: 'http://lu.ma/abc' } });
    fireEvent.blur(field());

    await waitFor(() => expect(form.current.getValues('registrationUrl')).toBe('http://lu.ma/abc'));
  });

  it('says the link is not valid on leaving the field, then clears it once the address is fixed', async () => {
    renderSection(<RegistrationSection />);

    fireEvent.change(field(), { target: { value: 'ffffghhfff' } });
    fireEvent.blur(field());
    expect(await screen.findByText('Enter a valid registration link')).toBeInTheDocument();

    fireEvent.change(field(), { target: { value: 'https://ffffghhfff.com' } });
    await waitFor(() => expect(screen.queryByText('Enter a valid registration link')).not.toBeInTheDocument());
  });

  it('leaves an empty field empty and without a message', async () => {
    const { form } = renderSection(<RegistrationSection />);

    fireEvent.blur(field());

    await waitFor(() => expect(form.current.getValues('registrationUrl')).toBe(''));
    expect(screen.queryByText('Enter a valid registration link')).not.toBeInTheDocument();
  });
});
