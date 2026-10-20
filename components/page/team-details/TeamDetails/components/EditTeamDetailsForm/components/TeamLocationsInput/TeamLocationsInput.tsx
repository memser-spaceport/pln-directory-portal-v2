import { useFieldArray, useFormContext } from 'react-hook-form';

import { TrashIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';

import { MAX_TEAM_LOCATION_LENGTH, MAX_TEAM_LOCATIONS } from '../../helpers';

import { PlusIcon } from './components/Icons';

import s from './TeamLocationsInput.module.scss';

type TLocationsForm = { locations: { value: string }[] };

export const TeamLocationsInput = () => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<TLocationsForm>();
  const { fields, append, remove, update, swap } = useFieldArray({ control, name: 'locations' });
  const locations = watch('locations');

  const error = errors.locations?.message ?? errors.locations?.root?.message;
  const isSingleEmptyRow = fields.length === 1 && !locations[0].value.trim();

  // The last row is emptied rather than removed, so there is always a field to type into.
  const removeRow = (index: number) => (fields.length === 1 ? update(0, { value: '' }) : remove(index));

  return (
    <div className={s.root} role="group" aria-labelledby="team-locations-label">
      <span className={s.label} id="team-locations-label">
        Locations
      </span>
      <ul className={s.list}>
        {fields.map((field, index) => {
          const value = locations[index].value.trim();
          const isPrimary = index === 0;

          return (
            <li key={field.id}>
              <FormField
                name={`locations.${index}.value`}
                placeholder="eg., San Francisco, United States"
                maxLength={MAX_TEAM_LOCATION_LENGTH}
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
                  {!isSingleEmptyRow && (
                    <button
                      type="button"
                      className={s.remove}
                      onClick={() => removeRow(index)}
                      aria-label={value ? `Remove ${value}` : `Remove location ${index + 1}`}
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
          <PlusIcon />
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
