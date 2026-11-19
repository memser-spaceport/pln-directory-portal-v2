import '@testing-library/jest-dom';
import { act, fireEvent, screen, within } from '@testing-library/react';

import { renderSection } from '@/components/page/events/event-form/EventForm.fixtures';
import { HostSection } from '@/components/page/events/event-form/HostSection';

/* The host and the co-host rows, against the form's `hostName`, `hostEmail` and `coHosts`. */

const addCoHost = () => fireEvent.click(screen.getByRole('button', { name: 'Add Co-Host' }));

describe('HostSection', () => {
  it('reads "Host (1)" with no co-hosts and writes the host fields', () => {
    const { form } = renderSection(<HostSection />);

    expect(screen.getByRole('heading', { name: 'Host (1)' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter Host Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Host Email'), { target: { value: 'ada@pl.xyz' } });

    expect(form.current.getValues()).toMatchObject({ hostName: 'Ada', hostEmail: 'ada@pl.xyz', coHosts: [] });
  });

  it('reads "Host (3)" after two co-hosts are added', () => {
    const { form } = renderSection(<HostSection />);

    addCoHost();
    addCoHost();
    fireEvent.change(screen.getByLabelText('Co-host 2 name'), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByLabelText('Co-host 2 email'), { target: { value: 'grace@pl.xyz' } });

    expect(screen.getByRole('heading', { name: 'Host (3)' })).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Enter Co-Host Name')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('Enter Co-Host Email')).toHaveLength(2);
    expect(form.current.getValues('coHosts')).toEqual([
      { name: '', email: '' },
      { name: 'Grace', email: 'grace@pl.xyz' },
    ]);
  });

  it('removes the row whose remove control is pressed', () => {
    const { form } = renderSection(<HostSection />, {
      values: {
        coHosts: [
          { name: 'Grace', email: '' },
          { name: 'Linus', email: 'linus@pl.xyz' },
        ],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove co-host 1' }));

    expect(screen.getByRole('heading', { name: 'Host (2)' })).toBeInTheDocument();
    expect(form.current.getValues('coHosts')).toEqual([{ name: 'Linus', email: 'linus@pl.xyz' }]);
    expect(screen.getByLabelText('Co-host 1 name')).toHaveValue('Linus');
  });

  it('shows a co-host message on its own row and clears it when that value changes', async () => {
    const { form } = renderSection(<HostSection />, {
      values: {
        coHosts: [
          { name: 'Grace', email: '' },
          { name: '', email: 'not-an-email' },
        ],
      },
    });
    act(() => form.current.setError('coHosts.1.name', { type: 'manual', message: 'Co-host name is required' }));
    act(() => form.current.setError('coHosts.1.email', { type: 'manual', message: 'Enter a valid email' }));

    const rows = within(screen.getByRole('list', { name: 'Co-hosts' })).getAllByRole('listitem');
    expect(await within(rows[1]).findByText('Co-host name is required')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Enter a valid email')).toBeInTheDocument();
    expect(within(rows[0]).queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Co-host 2 name'), { target: { value: 'Linus' } });

    expect(screen.queryByText('Co-host name is required')).not.toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('shows the host name message', async () => {
    const { form } = renderSection(<HostSection />);
    act(() => form.current.setError('hostName', { type: 'manual', message: 'Enter a valid host name' }));

    expect(await screen.findByText('Enter a valid host name')).toBeInTheDocument();
  });
});
