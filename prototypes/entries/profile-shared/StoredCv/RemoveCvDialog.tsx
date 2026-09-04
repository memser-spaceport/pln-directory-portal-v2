'use client';

import ConfirmDialog from '@/components/core/ConfirmDialog/ConfirmDialog';

interface RemoveCvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * "Remove CV?" — the confirmation, and the two facts it exists to state.
 *
 * Production's own `ConfirmDialog`, the one the same profile stack already opens
 * for "Delete Experience" ("Are you sure you want to delete selected
 * experience?" / Cancel / Delete). Same shell, same button pair, same red
 * confirm — a removal in this product asks once, in this box.
 *
 * **Why it asks at all.** A ✕ on a chip does not confirm, and neither should it:
 * un-choosing a draft costs nothing. A kept CV has readers who are not on this
 * screen — the hiring teams of every application it travelled with — and the
 * press changes what they see. That is the test for a confirmation: not "is this
 * hard to undo" (re-uploading is one drop) but "does this reach someone else".
 *
 * **The two sentences are the two things nothing else on screen can say.** The
 * first answers the open question — *do the imported fields stay?* — and the
 * answer is yes, because the review card made each of them the person's own
 * answer (ticked, saved, and possibly edited since); a file is where they came
 * from, not where they live. The second is the consequence for the people not
 * in the room, stated plainly rather than narrated after the fact (lesson 4). No
 * third sentence: "You can upload a new one any time" is what the empty card
 * under this dialog will say for itself the moment it closes.
 */
export function RemoveCvDialog({ isOpen, onClose, onConfirm }: RemoveCvDialogProps) {
  return (
    <ConfirmDialog
      title="Remove CV"
      desc="Your profile keeps what was filled in from it. Teams you've applied to will no longer see it."
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmTitle="Remove"
    />
  );
}
