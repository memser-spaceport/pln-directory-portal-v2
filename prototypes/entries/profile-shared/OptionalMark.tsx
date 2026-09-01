'use client';

import s from './OptionalMark.module.scss';

/**
 * `(Optional)`, hugging the label it qualifies.
 *
 * **Production's own idiom, not a new one.** `SignupWizard` marks its free-text
 * field this way — `<span className={aboutLabelOptional}>(Optional)</span>` set
 * immediately after the label text at weight 400 in `#8897ae`, against the
 * label's own 500 — and that is the only place in the product that marks a field
 * optional at all. So the parenthesis, the position and the two-step drop in
 * weight and tone are transcribed rather than chosen.
 *
 * **Why it exists here.** Three surfaces offer the CV importer — the apply
 * flow's account step, the job board's profile step and the onboarding page —
 * and all three needed the same mark on the same card. Shared for the reason
 * `PlTeamOnlyPill` beside it is: one definition, so three cards can't drift on
 * what "optional" looks like.
 *
 * It is rendered *inside* `DetailsSectionHeader`'s `title` (which takes a
 * `ReactNode`), not in its children slot. The children slot is the header's
 * right-hand column — where the PL-team pill and a Cancel button go — and a
 * qualifier that floated to the far right would read as a separate control
 * rather than as part of the heading.
 */
export function OptionalMark() {
  return <span className={s.mark}>(Optional)</span>;
}
