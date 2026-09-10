'use client';

import type { ReactNode } from 'react';

import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';

import { UnsavedEditsProvider, useUnsavedEditsRegistry } from './UnsavedEditsContext';
import { useUnsavedLeaveGuard } from './useUnsavedLeaveGuard';

/**
 * Wrap a page of editable profile sections, and leaving it asks first.
 *
 * The sections need no changes: both of the controls components every edit form
 * is built from register themselves, so anything inside this is covered — and
 * anything added later is covered without being told.
 *
 * **A page asks; a step holds.** The apply drawer refuses the move, scrolls to
 * the section and points at its Save, because someone moving between steps of a
 * flow is staying. Someone clicking "Directory" is going somewhere else, and
 * holding them until every open form is closed would mean they could not
 * navigate at all. So this is a question with a way through, not a block.
 */
export function UnsavedEditsPageGuard({ children }: { children: ReactNode }) {
  const registry = useUnsavedEditsRegistry();
  const { isLeaving, confirmLeave, cancelLeave } = useUnsavedLeaveGuard(registry);

  return (
    <UnsavedEditsProvider value={registry}>
      {children}
      <UnsavedChangesPrompt show={isLeaving} onConfirm={confirmLeave} onCancel={cancelLeave} />
    </UnsavedEditsProvider>
  );
}
