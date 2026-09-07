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
 * **The design owns this copy.** Item 1 is transcribed from Figma node
 * 682:11192; item 2 was rewritten to the wording below on 2026-09-04, on the
 * design's instruction, and is no longer that node's sentence. Neither was
 * written here. That distinction matters because an earlier pass reworded both
 * items locally — on the grounds that the flow does not notify a team or rank a
 * candidate — and the reword was reverted.
 *
 * So: do not "fix" these strings against what the code does today. If item 2's
 * promise is to become true it becomes true in the flow, not by softening the
 * sentence, and if it is not going to, that is a conversation for the design.
 * Change them when the design says so.
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
    head: 'Signal interest',
    body: 'Signal interest in specific roles to multiply your visibility.',
  },
] as const;
