import { useEffect } from 'react';

/**
 * Size a textarea to its own content.
 *
 * The reset to `auto` is the whole trick: `scrollHeight` never reports less than
 * the element's current height, so without it the box could only ever grow — a
 * note that was long and then cleared would keep the height of the note that is
 * no longer there.
 *
 * Exported on its own because it is the only part of this that can be proved.
 * jsdom reports `scrollHeight: 0` for everything, so a DOM-level test could only
 * ever assert `height: '0px'` and would pass just as happily against a function
 * that did nothing. A fake element makes the order of the two writes visible,
 * which is the behaviour worth locking.
 */
export function autosizeTextarea(el: Pick<HTMLTextAreaElement, 'style' | 'scrollHeight'>): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Keep a textarea sized to its value, for a control this folder does not own.
 *
 * **Found by id, not by ref.** `FormTextArea` spreads `{...register(name)}` and
 * then `{...rest}` onto the same `<textarea>`, so a ref passed through props
 * would land second and overwrite react-hook-form's — taking registration,
 * focus and validation with it. The component does set `id={name}`, and
 * production already reaches this exact element the same way
 * (`hooks/useScrollIntoViewOnFocus.ts`), so the lookup is house style rather
 * than a way around the rule that this folder must not edit the primitive.
 *
 * **Driven by the value, not by input events.** Three of the four ways this note
 * changes are programmatic — the drafted note landing, "Reset to template", and
 * the field being cleared when the referee is removed — and an `onInput`
 * listener would see none of them. The form already watches `message`, so the
 * value is a dependency that is free and complete.
 *
 * No-ops when the element isn't there, which is the case under test: the suite's
 * `FormTextArea` mock renders a bare textarea with no id.
 */
export function useAutosizeTextarea(id: string, value: string | undefined, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const el = document.getElementById(id);
    if (!(el instanceof HTMLTextAreaElement)) return;
    autosizeTextarea(el);
  }, [id, value, enabled]);
}
