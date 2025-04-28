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
import AddEditTagModal from '../../../components/page/settings/intro-rules/add-edit-tag-modal';
import { EVENTS } from '../../../utils/constants';

function openModal(mode: 'add' | 'edit', tag?: { id: string; name: string }) {
  document.dispatchEvent(
    new CustomEvent(EVENTS.ADD_EDIT_TAG_MODAL, {
      detail: { mode, tag },
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

describe('AddEditTagModal', () => {
  beforeEach(() => {
    // Clean up modal root and listeners
    document.body.innerHTML = '';
  });

  it('renders and opens in add mode', async () => {
    render(<AddEditTagModal />);
    patchDialog();
    openModal('add');
    expect(await screen.findByText(/Add New Tag/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter tag name/i)).toBeInTheDocument();
    expect(screen.getByText('Add Tag')).toBeInTheDocument();
  });

  it('renders and opens in edit mode with tag', async () => {
    render(<AddEditTagModal />);
    patchDialog();
    openModal('edit', { id: '1', name: 'Blockchain' });
    expect(await screen.findByText(/Edit Tag/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Blockchain')).toBeInTheDocument();
  });


  it('calls onSubmit and closes modal on valid submit (add)', async () => {
    render(<AddEditTagModal />);
    patchDialog();
    openModal('add');
    const input = await screen.findByPlaceholderText(/Enter tag name/i);
    fireEvent.change(input, { target: { value: 'NewTag' } });
    const saveBtn = screen.getByText('Add Tag');
    fireEvent.click(saveBtn);
    // Wait for the dialog to close
    await waitFor(() => {
        const dialog = document.querySelector('dialog');
        expect(dialog?.hasAttribute('open')).toBe(false);
      });
  });

  it('calls onSubmit and closes modal on valid submit (edit)', async () => {
    render(<AddEditTagModal />);
    patchDialog();
    openModal('edit', { id: '1', name: 'Blockchain' });
    const input = await screen.findByDisplayValue('Blockchain');
    fireEvent.change(input, { target: { value: 'UpdatedTag' } });
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);
    // Wait for the dialog to close
    await waitFor(() => {
        const dialog = document.querySelector('dialog');
        expect(dialog?.hasAttribute('open')).toBe(false);
      });
  });

  it('closes modal on cancel', async () => {
    render(<AddEditTagModal />);
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

  it('disables the Add Tag button when input is empty', async () => {
    render(<AddEditTagModal />);
    patchDialog();
    openModal('add');
    const addBtn = await screen.findByText('Add Tag');
    expect(addBtn).toBeDisabled();

    // Enter a value
    const input = screen.getByPlaceholderText(/Enter tag name/i);
    fireEvent.change(input, { target: { value: 'SomeTag' } });
    expect(addBtn).not.toBeDisabled();

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });
    expect(addBtn).toBeDisabled();
  });
});
