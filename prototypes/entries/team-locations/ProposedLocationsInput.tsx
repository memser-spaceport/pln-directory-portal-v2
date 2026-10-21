'use client';

/**
 * Proposed — the same `locations` array and the same `locations[0]` contract, so
 * nothing changes for the API. Changes against the feature env:
 *
 * 1. "Primary", not "HQ". The slot was filled from the old single "Location"
 *    field ("Where your team is based"), so calling it a headquarters would
 *    claim one for every existing team — and remote or multi-hub teams may not
 *    have one. All the first slot does is show first.
 * 2. One list. The primary row carries a "Primary" badge — the DS Badge,
 *    Blue / Light / md, transcribed in .primaryBadge because the app doesn't
 *    load DS tokens — in the same slot
 *    where every other filled row has "Make primary" (`swap(0, i)`), so the
 *    badge and the links explain each other — the primary-email pattern. The
 *    feature env's chip was the only mark of its kind on the list, with the rule
 *    behind it ("the first one is your HQ") only in the hint under it.
 * 3. Removing a row is the product's remove-from-list mark — the grey 16px
 *    `TrashIcon` inside the field's right edge, as on the IRL attendee form's
 *    sub-event rows — not a field-height bordered ✕. In the DS a ✕ dismisses or
 *    clears (chips, SearchInput, modal close); it never removes a record.
 *    Removing the primary promotes the next row, which then wears the badge.
 *
 * There is no resting empty row beyond the first: "Add location" appends one
 * and focuses it. Saving stays the form's one Save — a per-row save would let a
 * "saved" row be thrown away by Cancel.
 */
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { TrashIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';

import { MAX_TEAM_LOCATIONS } from './mocks';

import s from './ProposedLocationsInput.module.scss';

type TLocationsForm = { locations: { value: string }[] };

const PLACEHOLDER = 'eg., San Francisco, United States';

export const ProposedLocationsInput = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<TLocationsForm>();
  const { fields, append, remove, update, swap } = useFieldArray({ control, name: 'locations' });
  const values = useWatch({ control, name: 'locations' });

  const error = errors.locations?.message ?? errors.locations?.root?.message;

  // The only row is emptied rather than removed, so there is always a field to type into.
  const removeRow = (index: number) => (fields.length === 1 ? update(0, { value: '' }) : remove(index));

  return (
    <div className={s.root} role="group" aria-labelledby="team-locations-label">
      <span className={s.label} id="team-locations-label">
        Locations
      </span>

      <ul className={s.list}>
        {fields.map((field, index) => {
          const value = values?.[index]?.value?.trim() ?? '';
          const isPrimary = index === 0;
          // An empty lone row has nothing to remove.
          const canRemove = fields.length > 1 || Boolean(value);

          return (
            <li key={field.id}>
              <FormField
                name={`locations.${index}.value`}
                placeholder={PLACEHOLDER}
                aria-label={isPrimary ? 'Primary location' : `Location ${index + 1}`}
              >
                <div className={s.rowActions}>
                  {isPrimary && value && <span className={s.primaryBadge}>Primary</span>}
                  {!isPrimary && value && (
                    <button
                      type="button"
                      className={s.makePrimary}
                      onClick={() => swap(0, index)}
                      aria-label={`Make ${value} your primary location`}
                    >
                      Make primary
                    </button>
                  )}
                  {canRemove && (
                    <button
                      type="button"
                      className={s.remove}
                      onClick={() => removeRow(index)}
                      aria-label={`Remove ${value || `location ${index + 1}`}`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </FormField>
            </li>
          );
        })}
      </ul>

      {fields.length < MAX_TEAM_LOCATIONS && (
        <button type="button" className={s.add} onClick={() => append({ value: '' })}>
          <AddIcon />
          Add location
        </button>
      )}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : (
        <p className={s.description}>Up to {MAX_TEAM_LOCATIONS} places. Your primary location shows first.</p>
      )}
    </div>
  );
};

/**
 * A bare plus, not the DS `PlusIcon` (a plus in a circle, whose one production
 * home is the mobile Filters button): every add glyph inside a form row in
 * production draws the plus on its own.
 */
const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
