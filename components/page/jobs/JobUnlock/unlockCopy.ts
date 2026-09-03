/**
 * The case for a profile, in words. One module, three surfaces.
 *
 * **Why it is not inside a component.** These strings used to live in
 * `JobUnlockBanner`, which was their only reader. They now have three: the card
 * in the body of the review step, the popover under the drawer's footer, and the
 * modal that popover becomes on a phone. Left in the banner, the next frame
 * change would have had to find all three, and the one it missed would have gone
 * on saying the old thing to whoever happened to open it.
 *
 * **The copy is the design's, verbatim.** Every string below is transcribed from
 * Figma node 682:11192 rather than written here, and that is deliberate: an
 * earlier pass reworded both items on the grounds that the flow does not
 * currently notify a team or rank a candidate, and the reword was reverted. The
 * design owns this copy. If item 2's promise is to become true, it becomes true
 * in the flow, not by softening the sentence — and if it is not going to, that is
 * a conversation for the design, not a local edit.
 *
 * So: do not "fix" these strings against what the code does today. Change them
 * when the frame changes.
 */

/** The card's heading, and the accessible name of the popover and the modal. */
export const UNLOCK_TITLE = 'What your profile unlocks';

/**
 * The footer control that opens the popover — the same words plus a question
 * mark, which is the design's distinction and not a typo: a control asks, a
 * heading states. Two constants because they are two strings, and because a
 * `${UNLOCK_TITLE}?` would quietly rewrite the button the next time the heading
 * changed.
 */
export const UNLOCK_TRIGGER_LABEL = 'What your profile unlocks?';

/* Transcribed from Figma node 682:11192. Not paraphrased, not shortened. */
export const UNLOCK_ITEMS = [
  {
    head: 'Get discovered',
    body: 'We surface your profile to founders whose open roles match your background.',
  },
  {
    head: 'Signal interest in a specific role',
    body: 'Interested? The team sees you first. You can do this without applying on their site.',
  },
] as const;
