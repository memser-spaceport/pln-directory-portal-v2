import '@testing-library/jest-dom';
import { act, render, waitFor } from '@testing-library/react';

import { ContactSupportUrlSync } from '@/components/ContactSupport/ContactSupportUrlSync';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';

const visit = (search: string) => window.history.replaceState({}, '', `/members${search}`);

/* LAB-2879: `?dialog=giveFeedback` opens the AI Apps feedback drawer for members. */
describe('ContactSupportUrlSync', () => {
  beforeEach(() => {
    act(() => {
      useContactSupportStore.getState().actions.closeModal();
      useFeedbackDrawerStore.getState().actions.closeDrawer();
    });
  });

  afterEach(() => visit(''));

  it('opens the feedback drawer for a member and drops the link parameter', async () => {
    visit('?dialog=giveFeedback');

    render(<ContactSupportUrlSync isLoggedIn />);

    await waitFor(() => expect(useFeedbackDrawerStore.getState().open).toBe(true));
    expect(useContactSupportStore.getState().open).toBe(false);
    expect(window.location.search).toBe('');
  });

  it('keeps the support form on Give feedback for a signed-out visitor', async () => {
    visit('?dialog=giveFeedback');

    render(<ContactSupportUrlSync isLoggedIn={false} />);

    await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
    expect(useContactSupportStore.getState().topic).toBe('Give feedback');
    expect(useFeedbackDrawerStore.getState().open).toBe(false);
  });

  it('keeps the support form for the other topics', async () => {
    visit('?dialog=reportBug');

    render(<ContactSupportUrlSync isLoggedIn />);

    await waitFor(() => expect(useContactSupportStore.getState().open).toBe(true));
    expect(useContactSupportStore.getState().topic).toBe('Report a bug');
    expect(useFeedbackDrawerStore.getState().open).toBe(false);
  });
});
