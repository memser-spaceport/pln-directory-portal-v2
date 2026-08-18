'use client';

// The Rules tab: the body's `{{#if}}` blocks as labelled fields.
//
// Transcribed from Intercom's "Dynamic content settings" sheet — the If /
// Then display / "If none of the above match then display" ladder, the
// + Add condition action, the trash on the rule row. Their vocabulary is better
// than anything invented here: "if none of the above match then display" is
// what `{{else}}` MEANS, spelled out, and an admin who would never type a
// handlebar can still answer it.
//
// WHAT THIS IS NOT
// Not a second draft of the template. Both tabs read and write the one body
// string: this panel parses the blocks out of it and writes edits back into the
// exact span they came from, so the syntax tab shows every change the moment it
// is made, and switching tabs can never lose work. That is also the honest way
// to show the trade — you can watch the structured edit become the syntax.
//
// WHERE IT DIVERGES FROM THE SCREENSHOT, AND WHY
//  - Intercom's "If" row is "+ Add data rule", opening a field/operator/value
//    builder. Ours is a variable picker and a fixed "has a value", because the
//    resolver supports exactly one test. An operator dropdown, or an empty rule
//    row promising comparisons the send cannot make, would be a lie told in the
//    shape of a control.
//  - "+ Add condition" appends one more block rather than adding a branch to the
//    current one. Same reason: `{{#if}}` has no `{{else if}}` here, and stacking
//    real blocks is the truthful version of the same gesture.
//  - No "New" pill and no help link: nothing to link to in a prototype.

import { useMemo } from 'react';

import { Button } from '@/components/common/Button';

import { TEMPLATE_VARIABLES } from './inviteTemplate';
import type { DynamicRule } from './inviteTemplate';
import { TrashIcon } from './SpotlightIcons';

import s from './DynamicContentPanel.module.scss';

interface DynamicContentPanelProps {
  rules: DynamicRule[];
  onChange: (rule: DynamicRule, patch: Partial<DynamicRule>) => void;
  onRemove: (rule: DynamicRule) => void;
  onAdd: (key: string) => void;
}

export default function DynamicContentPanel({ rules, onChange, onRemove, onAdd }: DynamicContentPanelProps) {
  // The variable a new rule should test: the first one no rule uses yet, falling
  // back to the row-level one. Offering a variable that is already conditional
  // would produce two blocks fighting over the same value.
  const nextKey = useMemo(() => {
    const used = new Set(rules.map((rule) => rule.key));
    return TEMPLATE_VARIABLES.find((variable) => !used.has(variable.key))?.key ?? 'sector_hook';
  }, [rules]);

  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <span className={s.panelTitle}>Dynamic content</span>
        <p className={s.panelDesc}>
          Personalise the invite for part of the list by adding conditions to content. Each one is a block in the body
          opposite.
        </p>
      </div>

      {rules.length === 0 && (
        <p className={s.empty}>
          No conditions yet — every recipient gets the same words, and a line whose variable is empty for someone is
          left out of their copy entirely.
        </p>
      )}

      {rules.map((rule) => (
        <div key={rule.index} className={s.rule}>
          <div className={s.row}>
            <span className={s.rowLabel}>If</span>
            <div className={s.ruleControls}>
              <select
                className={s.select}
                value={rule.key}
                onChange={(event) => onChange(rule, { key: event.target.value })}
                aria-label="Variable"
              >
                {TEMPLATE_VARIABLES.map((variable) => (
                  <option key={variable.key} value={variable.key}>
                    {`{{${variable.key}}}`}
                  </option>
                ))}
              </select>
              {/* Static, not a select. The resolver supports exactly one test —
                  whether the variable has a value — so an operator dropdown
                  would be offering a choice with one real option. "Is empty"
                  looks like the missing second one, but it is just this rule
                  with its two fields exchanged, and the author can do that by
                  swapping the text: a control that silently rewrote both fields
                  and then re-read as "has a value" looked like it had failed. */}
              <span className={s.operator}>has a value</span>
            </div>
            <button
              type="button"
              className={s.trash}
              onClick={() => onRemove(rule)}
              aria-label="Remove this condition"
              title="Remove this condition"
            >
              <TrashIcon />
            </button>
          </div>

          <div className={s.row}>
            <span className={s.rowLabel}>Then display</span>
            <textarea
              className={s.contentField}
              value={rule.then}
              onChange={(event) => onChange(rule, { then: event.target.value })}
              placeholder="Enter the content for this condition"
              rows={3}
            />
          </div>

          {/* Intercom's wording, kept verbatim — it is the clearest statement of
              the else branch anyone in the survey had, and the reason this tab
              exists at all. An empty field is a real answer here: it means the
              passage is dropped, which is what the template does without an
              `{{else}}`. */}
          <div className={`${s.row} ${s.rowFallback}`}>
            <span className={s.rowLabel}>If it doesn’t match then display</span>
            <textarea
              className={s.contentField}
              value={rule.otherwise}
              onChange={(event) => onChange(rule, { otherwise: event.target.value })}
              placeholder="Leave empty to show nothing"
              rows={2}
            />
          </div>
        </div>
      ))}

      {/* Production `Button`, link style, rather than a hand-rolled one.
          It had a grey fill on hover, which is not a state the design system
          has: `.link` is `background: transparent; padding: 0; border-radius: 0`
          and its hover only darkens the blue (#1b4dff → #0f3cd9). Production's
          own "+ Add" controls agree — MatchesEditor's is bare blue text with a
          gap and no hover fill at all. The tinted rectangle was an invention
          that read as a secondary button rather than as a text action. */}
      <Button style="link" variant="primary" size="s" className={s.addButton} onClick={() => onAdd(nextKey)}>
        <span aria-hidden="true">+</span> Add condition
      </Button>
      {rules.length > 0 && <p className={s.addNote}>A new condition is added as its own paragraph at the end.</p>}
    </div>
  );
}
