'use client';

/**
 * Add / edit a trip.
 *
 * Inline rather than a modal: three fields do not warrant a dialog, and keeping
 * it in place means the calendar stays visible while you adjust the dates you
 * just dragged.
 */

import { Badge } from '@/components/common/Badge';
import { ChevronDownIcon } from '@/components/icons';
import { getFormattedDateString } from '@/utils/irl.utils';
import { CityCombobox } from './CityCombobox';
import { VISIBILITY_OPTIONS } from './mocks';
import { TrashIcon } from './icons';
import s from './MyPlan.module.scss';

export interface TripDraft {
  id?: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  note: string;
  eventName?: string;
}

interface TripEditorProps {
  draft: TripDraft;
  onChange: (draft: TripDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function TripEditor({ draft, onChange, onSave, onCancel, onDelete }: TripEditorProps) {
  const isEditing = Boolean(draft.id);
  const canSave = Boolean(draft.city) && draft.startDate <= draft.endDate;

  return (
    <div className={s.editor}>
      <div className={s.editorHead}>
        <h3 className={s.editorTitle}>{isEditing ? 'Edit trip' : 'Add a trip'}</h3>
        {draft.eventName && <Badge variant="brand">{draft.eventName}</Badge>}
      </div>

      <div className={s.field}>
        <label className={s.label}>City</label>
        <CityCombobox
          value={draft.city ? { city: draft.city, country: draft.country } : null}
          onChange={(option) => onChange({ ...draft, city: option.city, country: option.country })}
        />
      </div>

      <div className={s.fieldRow}>
        <div className={s.field}>
          <label className={s.label} htmlFor="trip-start">
            Arrive
          </label>
          <input
            id="trip-start"
            type="date"
            className={s.dateInput}
            value={draft.startDate}
            onChange={(event) => onChange({ ...draft, startDate: event.target.value })}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="trip-end">
            Leave
          </label>
          <input
            id="trip-end"
            type="date"
            className={s.dateInput}
            value={draft.endDate}
            min={draft.startDate}
            onChange={(event) => onChange({ ...draft, endDate: event.target.value })}
          />
        </div>
      </div>

      {draft.startDate && draft.endDate && draft.startDate <= draft.endDate && (
        <p className={s.rangeEcho}>{getFormattedDateString(draft.startDate, draft.endDate)}</p>
      )}

      <div className={s.field}>
        <label className={s.label} htmlFor="trip-note">
          Note <span className={s.optional}>optional</span>
        </label>
        <input
          id="trip-note"
          className={s.textInput}
          placeholder="Open for coffee, here for LabWeek…"
          value={draft.note}
          onChange={(event) => onChange({ ...draft, note: event.target.value })}
        />
      </div>

      {/* Privacy is deliberately shape-only — the user deferred building it, so the
          control exists to fix the model but is inert. */}
      <div className={s.field}>
        <label className={s.label}>Who can see this</label>
        <div className={s.visibilityRow} title="Not in this prototype">
          {/* The native <select> arrow was showing through — a platform triangle
              that matches nothing else on the form. Suppressed, and replaced
              with the DS glyph every other select in the app uses. */}
          <span className={s.selectWrap}>
            <select className={s.select} disabled defaultValue="everyone">
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className={s.selectCaret} width={16} height={16} aria-hidden />
          </span>
          <span className={s.soonTag}>Later</span>
        </div>
      </div>

      <div className={s.editorActions}>
        {isEditing && onDelete && (
          <button type="button" className={s.deleteBtn} onClick={onDelete}>
            <TrashIcon />
            Delete
          </button>
        )}
        <span className={s.spacer} />
        <button type="button" className={s.ghostBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={s.primaryBtn} disabled={!canSave} onClick={onSave}>
          {isEditing ? 'Save trip' : 'Add trip'}
        </button>
      </div>
    </div>
  );
}
