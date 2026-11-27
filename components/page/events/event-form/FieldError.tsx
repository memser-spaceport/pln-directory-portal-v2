import s from './EventForm.module.scss';

/** A check's message under its field. `data-field-error` is what the form scrolls to. */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className={s.error} role="alert" data-field-error>
      {message}
    </p>
  );
}
