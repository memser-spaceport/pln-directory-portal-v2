// Polyfill for <dialog> in jsdom
if (typeof HTMLDialogElement === 'undefined') {
  class HTMLDialogElement extends HTMLElement {
    open = false;
    showModal = () => { this.open = true; };
    close = () => { this.open = false; };
  }
  // @ts-ignore
  window.HTMLDialogElement = HTMLDialogElement;
}

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddEditTopicModal from '../../../components/page/settings/intro-rules/add-edit-topic-modal';
import { EVENTS } from '../../../utils/constants';

function openModal(mode: 'add' | 'edit', topic?: { id: string; name: string }) {
  document.dispatchEvent(
    new CustomEvent(EVENTS.ADD_EDIT_TOPIC_MODAL, {
      detail: { mode, topic },
    })
  );
}

// Patch dialog for jsdom
function patchDialog() {
  const dialog = document.querySelector('dialog');
  if (dialog) {
    // @ts-ignore
    dialog.showModal = () => { dialog.setAttribute('open', ''); };
    // @ts-ignore
    dialog.close = () => { dialog.removeAttribute('open'); };
  }
}

describe('AddEditTopicModal', () => {
  beforeEach(() => {
    // Clean up modal root and listeners
    document.body.innerHTML = '';
  });

  it('renders and opens in add mode', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('add');
    expect(await screen.findByText(/Add New Topic/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter topic name/i)).toBeInTheDocument();
    expect(screen.getByText('Add Topic')).toBeInTheDocument();
  });

  it('renders and opens in edit mode with topic', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('edit', { id: '1', name: 'Filecoin' });
    expect(await screen.findByText(/Edit Topic/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Filecoin')).toBeInTheDocument();
  });

  it('calls onSubmit and closes modal on valid submit (add)', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('add');
    const input = await screen.findByPlaceholderText(/Enter topic name/i);
    fireEvent.change(input, { target: { value: 'NewTopic' } });
    const saveBtn = screen.getByText('Add Topic');
    fireEvent.click(saveBtn);
    // Wait for the dialog to close
    await waitFor(() => {
      const dialog = document.querySelector('dialog');
      expect(dialog?.hasAttribute('open')).toBe(false);
    });
  });

  it('calls onSubmit and closes modal on valid submit (edit)', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('edit', { id: '1', name: 'Filecoin' });
    const input = await screen.findByDisplayValue('Filecoin');
    fireEvent.change(input, { target: { value: 'UpdatedTopic' } });
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);
    // Wait for the dialog to close
    await waitFor(() => {
      const dialog = document.querySelector('dialog');
      expect(dialog?.hasAttribute('open')).toBe(false);
    });
  });

  it('closes modal on cancel', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('add');
    const cancelBtn = await screen.findByText('Cancel');
    fireEvent.click(cancelBtn);

    // Wait for the dialog to close
    await waitFor(() => {
      const dialog = document.querySelector('dialog');
      expect(dialog?.hasAttribute('open')).toBe(false);
    });
  });

  it('disables the Add Topic button when input is empty', async () => {
    render(<AddEditTopicModal />);
    patchDialog();
    openModal('add');
    const addBtn = await screen.findByText('Add Topic');
    expect(addBtn).toBeDisabled();

    // Enter a value
    const input = screen.getByPlaceholderText(/Enter topic name/i);
    fireEvent.change(input, { target: { value: 'SomeTopic' } });
    expect(addBtn).not.toBeDisabled();

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });
    expect(addBtn).toBeDisabled();
  });
});
