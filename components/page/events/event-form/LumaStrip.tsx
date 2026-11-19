import s from './LumaStrip.module.scss';

const TEXT = {
  detected: 'Luma Link Detected! Submit faster with auto-import',
  importing: 'Importing From Luma...',
  imported: 'Details in this form were imported from the above Luma link',
} as const;

interface LumaStripProps {
  state: keyof typeof TEXT;
  disabled?: boolean;
  onFetch: () => void;
}

/** Under a Luma registration link: the offer to fill the form from it, the wait, and the note that it was filled. */
export function LumaStrip({ state, disabled, onFetch }: LumaStripProps) {
  return (
    <div className={s.strip} data-state={state}>
      <p className={s.text} role="status">
        {TEXT[state]}
      </p>
      {state !== 'importing' && (
        <button type="button" className={s.button} disabled={disabled} onClick={onFetch}>
          {state === 'imported' ? 'Fetch Again' : 'Fetch from Luma'}
        </button>
      )}
    </div>
  );
}
