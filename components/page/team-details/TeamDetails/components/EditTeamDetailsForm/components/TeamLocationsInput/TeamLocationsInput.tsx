import { useFieldArray, useFormContext } from 'react-hook-form';

import { CloseIcon, PlusIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';

import { MAX_TEAM_LOCATIONS } from '../../helpers';

import s from './TeamLocationsInput.module.scss';

type TLocationsForm = { locations: { value: string }[] };

export const TeamLocationsInput = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<TLocationsForm>();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'locations' });

  const error = errors.locations?.message ?? errors.locations?.root?.message;

  // The last row is emptied rather than removed, so there is always a field to type into.
  const removeRow = (index: number) => (fields.length === 1 ? update(0, { value: '' }) : remove(index));

  return (
    <div className={s.root} role="group" aria-labelledby="team-locations-label">
      <span className={s.label} id="team-locations-label">
        Locations
      </span>
      <ul className={s.list}>
        {fields.map((field, index) => (
          <li key={field.id} className={s.row}>
            <FormField
              name={`locations.${index}.value`}
              placeholder="eg., San Francisco, United States"
              aria-label={index === 0 ? 'HQ location' : `Location ${index + 1}`}
            >
              {index === 0 && <span className={s.hq}>HQ</span>}
            </FormField>
            <button
              type="button"
              className={s.remove}
              onClick={() => removeRow(index)}
              aria-label={index === 0 ? 'Remove HQ location' : `Remove location ${index + 1}`}
            >
              <CloseIcon />
            </button>
          </li>
        ))}
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
        <p className={s.description}>
          Where your team is based, up to {MAX_TEAM_LOCATIONS} places. The first one is your HQ.
        </p>
      )}
    </div>
  );
};
