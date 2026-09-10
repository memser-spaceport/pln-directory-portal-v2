'use client';

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * "Is anything on this screen half-edited?" — asked at the moment somebody tries
 * to leave, and answered by the forms themselves.
 *
 * **Why a registry rather than props.** The apply drawer's details step composes
 * five real section components, and every one of them owns its edit state
 * privately (`ProfileDetails` has `useState(editView)`, `ExperienceDetails` has
 * `useState<ExperienceView>`). None of them report it upward, and they are
 * shared with `/members/[id]`, so teaching each one to is five prop chains
 * through components that have no other reason to grow them — and a sixth
 * section added next year would be silently uncovered.
 *
 * What they *do* all have is `EditFormControls`, which every edit form in the app
 * renders, which already computes `isDirty`, and which mounts only while an
 * editor is open. It registers here, so the drawer gets the answer for free and
 * no section component changes.
 *
 * **It lives under `common/profile` rather than with the drawer that uses it**
 * because `EditFormControls` is the thing that registers, and a component in
 * `common/` importing from `page/jobs/` would point the dependency the wrong way.
 *
 * **Absent by default.** `useUnsavedEdits` returns `null` where no provider is
 * mounted, which is everywhere except the two job drawers — the other eleven
 * `EditFormControls` call sites across team-details and demo-day carry on
 * exactly as before.
 */

export interface UnsavedEntry {
  /** Stable per mounted form. */
  id: string;
  /**
   * Mutated in place, deliberately — see `register`. Never read during render.
   */
  isDirty: boolean;
  /** Where to scroll, and what the popup hangs off. */
  getElement: () => HTMLElement | null;
}

export interface UnsavedEditsApi {
  /** Called by a form as it mounts. Returns its own removal. */
  register: (entry: UnsavedEntry) => () => void;
  /**
   * Fires when the answer to "is anything dirty" may have *changed* — a form
   * registering, unregistering, or crossing the dirty line. Not on every
   * keystroke: `isDirty` only flips once.
   *
   * Exists for the page-level leave guard, which has to keep a history entry in
   * step with dirtiness and so cannot simply ask at press time. Nothing else
   * should subscribe: pulling with `firstDirty` is what keeps typing out of the
   * render path.
   */
  subscribe: (listener: () => void) => () => void;
  /** Called by registered forms when their dirtiness changes. */
  notifyChanged: () => void;
  /**
   * The dirty form nearest the top of the document, or `null` if none is.
   * Pulled at press time; see the note on `register`.
   */
  firstDirty: () => UnsavedEntry | null;
  /** Which form is being pointed at right now. The only piece of state here. */
  flaggedId: string | null;
  flag: (id: string) => void;
  clearFlag: () => void;
}

const UnsavedEditsContext = createContext<UnsavedEditsApi | null>(null);

export const UnsavedEditsProvider = UnsavedEditsContext.Provider;

/** For the forms. `null` outside a provider — never throws. */
export function useUnsavedEdits(): UnsavedEditsApi | null {
  return useContext(UnsavedEditsContext);
}

/**
 * Builds the registry. For the **host** — the component that both renders the
 * provider and guards its own navigation, which cannot consume its own context.
 */
export function useUnsavedEditsRegistry(): UnsavedEditsApi {
  /**
   * A ref, and this is the whole design.
   *
   * The obvious version keeps dirtiness in state and lets each form push into
   * it. That re-renders the entire details step **on every keystroke that flips
   * dirtiness**, putting the drawer's render path inside the typing loop for a
   * fact nobody looks at until somebody presses a button.
   *
   * So entries are mutable objects in a ref: registering and going dirty change
   * nothing React can see, and the answer is *pulled* by `firstDirty` at the
   * moment it is actually needed.
   */
  const entries = useRef(new Map<string, UnsavedEntry>());

  const [flaggedId, setFlaggedId] = useState<string | null>(null);

  const listeners = useRef(new Set<() => void>());

  const notifyChanged = useCallback(() => {
    listeners.current.forEach((listener) => listener());
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const register = useCallback(
    (entry: UnsavedEntry) => {
      entries.current.set(entry.id, entry);
      notifyChanged();
      return () => {
        entries.current.delete(entry.id);
        notifyChanged();
        /* Deliberately does NOT clear `flaggedId`. A flag pointing at a form that
         has gone renders nothing — the popup is drawn by the form itself, and
         only while it is still dirty — so the stale id is inert and the next
         press overwrites it. Clearing here would mean a state update from an
         effect cleanup, bought for no visible difference. */
      };
    },
    [notifyChanged],
  );

  const firstDirty = useCallback(() => {
    const dirty = [...entries.current.values()].filter((entry) => entry.isDirty);
    if (dirty.length === 0) return null;

    /* DOCUMENT ORDER, NOT REGISTRATION ORDER.
       Nothing stops two sections being open at once, and the map is keyed by
       mount order — which is the order the person *opened* them, not the order
       they appear. Sending someone to the second of two visible forms because
       they happened to open it first would look arbitrary. */
    return dirty.sort((a, b) => {
      const ea = a.getElement();
      const eb = b.getElement();
      if (!ea || !eb || ea === eb) return 0;
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    })[0];
  }, []);

  const flag = useCallback((id: string) => setFlaggedId(id), []);
  const clearFlag = useCallback(() => setFlaggedId(null), []);

  return useMemo(
    () => ({ register, subscribe, notifyChanged, firstDirty, flaggedId, flag, clearFlag }),
    [register, subscribe, notifyChanged, firstDirty, flaggedId, flag, clearFlag],
  );
}

/**
 * The whole guard, in the shape a navigation handler wants.
 *
 * Returns `true` when the move was **refused** — the caller should do nothing
 * else. Scrolling and flagging happen here so the three exits that share
 * `goTo` cannot drift on what "blocked" does.
 */
export function blockIfUnsaved(api: UnsavedEditsApi | null): boolean {
  const blocked = api?.firstDirty();
  if (!blocked) return false;

  blocked.getElement()?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  api?.flag(blocked.id);
  return true;
}

/**
 * Sign one edit form into the registry, and say where its popup goes.
 *
 * A hook rather than something each form writes out, because there are **two**
 * headers that every edit form in the app is built from — `EditFormControls` and
 * `EditOfficeHoursFormControls` — and they are interchangeable enough that one
 * form picks between them by variant. Registering in only one of them is exactly
 * the bug this replaced: Contact Details renders the office-hours header in the
 * drawer and the plain one everywhere else, so the guard saw Profile Details and
 * ignored Contact Details, on the same screen, for no reason a reader could see.
 *
 * Anything that grows a third header has to call this too, and having it in one
 * place is what makes that a line rather than a re-derivation.
 */
export function useUnsavedEditRegistration(isDirty: boolean) {
  const unsaved = useUnsavedEdits();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  /* Mutated, never state — see `useUnsavedEditsRegistry`. */
  const entryRef = useRef<UnsavedEntry>({
    id,
    isDirty: false,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    entryRef.current.isDirty = isDirty;
    /* Only on a *change* of dirtiness, not per keystroke — `isDirty` flips once
       and then stays. The page-level leave guard is the only listener. */
    unsaved?.notifyChanged();
  }, [isDirty, unsaved]);

  useEffect(() => unsaved?.register(entryRef.current), [unsaved]);

  /* Captured into state rather than read off the ref at render time, which
     `react-hooks/refs` forbids — and floating-ui needs a value to react to. */
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setAnchor(rootRef.current);
  }, []);

  return {
    /** Put this on the controls row: the scroll target and the popup's anchor. */
    rootRef,
    anchor,
    /* Derived, not stored, so saving or cancelling takes the popup away without
       anything having to remember to. */
    showPopup: Boolean(unsaved && unsaved.flaggedId === id && isDirty),
    dismissPopup: unsaved?.clearFlag ?? (() => {}),
  };
}
