'use client';

// PL Spotlight — the Overview card that sits above the participants table.
//
// Transcribed from the back-office app's own Overview section: a two-column
// label/value grid in the order Title · URL Slug / Status · Support Email /
// Sender Email · Sender Name / Reply-To Email / Analytics Report URL (with its
// caption) / Spotlight Statement, one "Edit" button top-right, em dashes for
// everything unset. Sizes, order, casing and the caption's wording are the
// app's; only the color layer is translated to token+fallback pairs, and the
// palette is the table's Tailwind-gray back-office one rather than the portal's
// (prototypes/CLAUDE.md #6, and the header note in the table's stylesheet).
//
// WHAT IS NEW: the Email Template row.
// The table below can send an email that nothing on the screen lets you read.
// The Overview is where that belongs: it is already the card that answers "what
// is this spotlight configured to do", and four of its rows are about the same
// email (Support / Sender / Sender Name / Reply-To). So the wording joins the
// addresses, immediately after them and before the analytics block.
//
// Two decisions inside that row:
//  - It is a label and a button, nothing else. An earlier pass previewed the
//    subject line here, with a Default/Customised pill, a variable count and a
//    sentence explaining the template's relationship to the table. All of it was
//    cut on review: the row's job is to say the template exists and to be the
//    door to it, and four lines of summary in a card of one-line values made a
//    configuration row read like a section. What the template says is the
//    editor's business.
//  - It does not fold into the card's Edit mode. Everything else here is a
//    string in a box; this is a subject, a body, five variables and a preview.
//    It gets its own modal, reachable in both view and edit mode, and the button
//    says "Edit template" so it is never confused with the card-level Edit.
//
// WHAT THE SCREENSHOT COULD NOT SHOW, AND SO WAS DECIDED HERE
//  - What "Edit" does. A dead button in a prototype gets reviewed as a design,
//    so it is real: the grid swaps to native inputs (native for the same reason
//    the table's selects are — this is a back-office app), and Edit is replaced
//    by Cancel / Save. Empty inputs save back as unset, i.e. as em dashes.
//  - Which field's empty state has a name. Sender Email's does — the screenshot
//    reads "System default", which is a configuration, not a blank. The rest are
//    em dashes.

import { Fragment, useState } from 'react';

import { SPOTLIGHT_STATUSES } from './mocks';
import type { SpotlightOverview as SpotlightOverviewData, SpotlightStatus } from './mocks';

import s from './SpotlightOverview.module.scss';

/** Only `title`, `slug` and `status` are required; the rest are `string | null`. */
type NullableKey = 'senderEmail' | 'senderName' | 'replyToEmail' | 'analyticsReportUrl' | 'statement';
type TextKey = 'title' | 'slug' | 'closesOn' | 'supportEmail' | NullableKey;

type Field = {
  key: TextKey | 'status';
  label: string;
  type: 'text' | 'email' | 'url' | 'status' | 'textarea';
  placeholder: string;
  /** Spans both columns — the screenshot's own layout for the last three rows. */
  span?: boolean;
  /** Rendered instead of the em dash when the value is unset. */
  emptyLabel?: string;
  caption?: string;
};

// Order note: the screenshot pairs Status with Support Email and leaves the cell
// beside Reply-To Email empty. Adding Closes forced a reflow either way, so the
// rows were regrouped by kind rather than shuffled by one: lifecycle together
// (Status · Closes), then the four addresses in two rows. Nothing is dropped,
// renamed or re-cased — every label below is still the app's.
const FIELDS: Field[] = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Spotlight title' },
  { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'url-slug' },
  { key: 'status', label: 'Status', type: 'status', placeholder: '' },
  // Not in the screenshot. The invite's first line is the deadline, so the
  // record has to hold one — see mocks.ts.
  { key: 'closesOn', label: 'Closes', type: 'text', placeholder: 'Monday, August 24th' },
  { key: 'supportEmail', label: 'Support Email', type: 'email', placeholder: 'support@example.com' },
  {
    key: 'senderEmail',
    label: 'Sender Email',
    type: 'email',
    placeholder: 'System default',
    emptyLabel: 'System default',
  },
  { key: 'senderName', label: 'Sender Name', type: 'text', placeholder: 'Sender name' },
  { key: 'replyToEmail', label: 'Reply-To Email', type: 'email', placeholder: 'reply-to@example.com' },
  // ── the Email Template row is rendered here, outside this list ──
  {
    key: 'analyticsReportUrl',
    label: 'Analytics Report URL',
    type: 'url',
    placeholder: 'https://…',
    span: true,
    caption: 'Visible as "Spotlight Stats" on the team card for founders and pitch admins only.',
  },
  {
    key: 'statement',
    label: 'Spotlight Statement',
    type: 'textarea',
    placeholder: 'What this spotlight is for…',
    span: true,
  },
];

/** The row the Email Template block follows — see the header note on ordering. */
const TEMPLATE_ROW_AFTER: Field['key'] = 'replyToEmail';

interface SpotlightOverviewProps {
  overview: SpotlightOverviewData;
  onSave: (overview: SpotlightOverviewData) => void;
  onEditTemplate: () => void;
  className?: string;
}

export default function SpotlightOverview({ overview, onSave, onEditTemplate, className }: SpotlightOverviewProps) {
  // Non-null ⇒ editing. Seeded on entering edit mode and dropped on leaving it,
  // so there is no stale draft to reset and no effect keeping two copies in step.
  const [draft, setDraft] = useState<SpotlightOverviewData | null>(null);
  const editing = draft !== null;

  const handleChange = (key: Field['key'], value: string) => {
    setDraft((current) => {
      if (!current) return current;
      if (key === 'status') return { ...current, status: value as SpotlightStatus };
      // Required fields keep '' (the input has to stay typable); the optional
      // ones collapse to null so an emptied box reads back as an em dash.
      const optional: NullableKey[] = ['senderEmail', 'senderName', 'replyToEmail', 'analyticsReportUrl', 'statement'];
      const isOptional = optional.includes(key as NullableKey);
      return { ...current, [key]: isOptional && value.trim() === '' ? null : value };
    });
  };

  const handleSave = () => {
    if (!draft) return;
    onSave(draft);
    setDraft(null);
  };

  const values = draft ?? overview;

  return (
    <section className={`${s.card} ${className ?? ''}`} aria-labelledby="spotlight-overview-heading">
      <header className={s.header}>
        <h2 className={s.heading} id="spotlight-overview-heading">
          Overview
        </h2>
        {editing ? (
          <div className={s.headerActions}>
            <button type="button" className={s.ghostButton} onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className={s.primaryButton} onClick={handleSave}>
              Save
            </button>
          </div>
        ) : (
          <button type="button" className={s.ghostButton} onClick={() => setDraft(overview)}>
            Edit
          </button>
        )}
      </header>

      <div className={s.grid}>
        {FIELDS.map((field) => {
          const raw = values[field.key as keyof SpotlightOverviewData];
          const value = typeof raw === 'string' ? raw : '';

          return (
            <Fragment key={field.key}>
              <div className={`${s.field} ${field.span ? s.span : ''}`}>
                <span className={s.label} id={`overview-${field.key}`}>
                  {field.label}
                </span>

                {editing ? (
                  field.type === 'status' ? (
                    <select
                      className={`${s.input} ${s.select}`}
                      value={value}
                      aria-labelledby={`overview-${field.key}`}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                    >
                      {SPOTLIGHT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className={`${s.input} ${s.textarea}`}
                      value={value}
                      rows={3}
                      placeholder={field.placeholder}
                      aria-labelledby={`overview-${field.key}`}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      className={s.input}
                      type={field.type === 'text' ? 'text' : field.type}
                      value={value}
                      placeholder={field.placeholder}
                      aria-labelledby={`overview-${field.key}`}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                    />
                  )
                ) : value === '' ? (
                  <span className={field.emptyLabel ? s.value : s.empty}>{field.emptyLabel ?? '—'}</span>
                ) : field.type === 'url' ? (
                  // Mocked target: prototypes never link out to real records.
                  <a className={s.valueLink} href="#report" onClick={(event) => event.preventDefault()}>
                    {value}
                  </a>
                ) : (
                  <span className={s.value}>{value}</span>
                )}

                {field.caption && <p className={s.caption}>{field.caption}</p>}
              </div>

              {field.key === TEMPLATE_ROW_AFTER && (
                <div className={`${s.field} ${s.span} ${s.templateField}`}>
                  <span className={s.label}>Email Template</span>
                  <div className={s.templateRow}>
                    <button type="button" className={s.ghostButton} onClick={onEditTemplate}>
                      Edit template
                    </button>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
