'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast as rtToast } from 'react-toastify';

// The house toast, whole: `toast` is the wrapper that renders production's
// `Toast` as the card, inside the container the root layout already mounts.
import { toast } from '@/components/core/ToastContainer';
import { Button } from '@/components/common/Button';
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';
import { InfoCircleIconOutlined } from '@/components/icons';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { mockAboutDraft, mockFillerSections, mockMember, reviewNote } from './mocks';
import s from './AppUpdateToastPrototype.module.scss';

/**
 * **How a deploy reaches someone who already has the tab open.**
 *
 * Today it doesn't. There is no service worker, no build-id check and no
 * `ChunkLoadError` handling anywhere in the app: a deploy lands, open tabs keep
 * running the old JS, and the first symptom is a lazy route 404-ing into
 * `components/core/error.tsx`, which shows the "Oh snap!" page. So every state
 * below is new; none of it is a transcription.
 *
 * ## Reuse map — what this imports rather than draws
 *
 * | Piece | Source | Why |
 * |---|---|---|
 * | The toast container | `core/ToastContainer` — already mounted in the root layout | Prototype routes sit inside it, so `toast()` here renders in the *production* container: bottom-centre, Slide, `closeButton={false}` |
 * | The card | `core/ToastContainer/components/Toast` | Its `info` theme is brand blue on `#f2f5ff` with `InfoCircleIcon`, and it carries **its own ✕** — so dismissal is inherited, not invented |
 * | The action | `common/Button`, `xxs` + `fill` + `primary` | The card's only action, so it keeps the rank and spends the size |
 * | The mid-flow question | `core/UnsavedChangesPrompt` | Already the app's answer to "you are about to lose edits" |
 * | The header | `nav-shared/PrototypeNavBar` | The real bar, so the toast is judged under real chrome |
 *
 * ## One toast, and it is on screen when the page opens
 *
 * There is no states sheet and no state picker. The page renders the one thing
 * this entry is asking about, in the real container at the foot of a page long
 * enough to scroll — a static copy pinned mid-page would be a second, larger,
 * unreal version of the subject competing with it. Holding position while the
 * content moves is half of what makes a toast the right object here, and a page
 * that fits the viewport cannot show that.
 *
 * ## The decisions this entry is asking about
 *
 * **Silent is the default and draws nothing.** A version bump changes nothing
 * the person can see, so a toast confirming one answers a question nobody
 * asked. The ordinary deploy is armed and applied at the next full navigation —
 * the person was already paying that page load — and they are never told. That
 * is the case this page cannot show, because there is nothing to show: it is
 * the empty page you would get by not shipping the toast at all.
 *
 * **The toast is only for the case where staying put costs something** — here,
 * an update the deploy marks required. It is the exception, not the reporting
 * channel for deploys.
 *
 * **It is the small end of the house card**, not the default one — see the
 * note on `--toast-default-width` in the stylesheet. A standing, passive notice
 * should not be the size of "Something went wrong".
 *
 * **It does not auto-close.** `autoClose: false`, and `closeOnClick: false` so
 * that reading the sentence cannot dismiss it. A prompt that expires after
 * five seconds is a prompt nobody can answer — which was the main argument
 * against a toast, and it is answerable with two options.
 *
 * **One `toastId`, so it can never stack.** A tab that has been open all day
 * has one of these, not nine.
 *
 * **Dismissal comes with the card.** Every house toast renders a ✕ (the
 * container disables *react-toastify's* button; `Toast` draws its own), so
 * removing it would be inventing a variant. Pressing it puts the toast away
 * for this tab; the condition is still true, so it returns on the next route
 * change — at which point the hard navigation has usually made it moot.
 *
 * **Mid-flow protection needs no second string.** The toast never reloads
 * anything by itself, and the one press that would is already guarded:
 * `UnsavedChangesPrompt` asks before the work is lost. Type in the About card,
 * then press Reload.
 *
 * **Multi-tab: share the fact, not the action.** Detection broadcasts on a
 * second `BroadcastChannel` (the shape `core/login/.../BroadcastChannel.tsx`
 * already uses for logout, localStorage fallback included) so one tab's
 * discovery saves the others from polling — but each tab decides for itself,
 * because dirtiness is per-tab. Deliberately unlike logout, which force-reloads
 * every tab: a logged-out tab still showing private data is a leak, a stale UI
 * is not. Not demonstrable in one window; stated here so it is not lost.
 *
 * **Accessibility.** No focus trap: a trap is for a modal you must answer now,
 * and this is a standing condition you may ignore until you have finished a
 * sentence. The container is announced politely (`role="status"`), never
 * assertively — it must not interrupt a task it is not blocking.
 *
 * ## Deliberately simplified
 *
 * - **Detection is assumed, not performed.** The page opens with the condition
 *   already true. In production it is a same-origin build-id check on
 *   `visibilitychange` plus a slow interval; which transport is an engineering
 *   call and changes nothing about the card.
 * - **Dirtiness is one textarea**, not the real `UnsavedEditsContext`
 *   registry. That registry is the right production wiring — but it is
 *   currently mounted only in the two job drawers, so covering the forum
 *   composer and the profile editors is the work item, not a design question.
 * - **Reload really reloads**, so the press is honest rather than mimed — but
 *   the toast comes back with the page, because there is no actual new build
 *   for the reload to apply. In production that press is the end of it: the
 *   fresh document is the new build, and the condition is gone.
 *
 * ## Two notes about mobile
 *
 * **A production bug, fixed here and only here.** The toast container's
 * `min-width` beats its own `max-width`, so on any phone narrower than 430px
 * the card overflows and its ✕ lands off-screen. Every toast in the product
 * has this; it matters here because dismissal is half the design. The override
 * and the full measurement are in the stylesheet, under DEVIATION.
 *
 * **One thing that is only wrong here.** `bottom: 72px` exists to clear
 * `MobileBottomNav`, which prototype routes hide (`PrototypeRouteChrome`), so
 * below tablet-landscape the toast floats 72px above nothing. In production it
 * sits on the bottom bar — that is the placement to judge, not this gap.
 */

const TOAST_ID = 'app-update-available';

/**
 * Run `fire` once the toast container is actually in the DOM, and return the
 * cleanup for it.
 *
 * **Why this exists.** `ToastContainer` is `dynamic()`-imported by the root
 * layout (`app/ClientDynamics`), so on a cold load it is not mounted while this
 * component runs its first effects — and react-toastify drops a toast emitted
 * with no container to put it in. The page therefore opened with *nothing on
 * it*, however the state was set, and every check that clicked something first
 * passed, because the click re-ran the effect after the container had arrived.
 *
 * Not a production concern in the same way: there, detection is a network round
 * trip, so the container is long since mounted by the time anything fires. It
 * is a concern for any surface that wants a toast on arrival.
 *
 * **Probe `.Toastify`, not `.Toastify__toast-container`.** The latter is only
 * rendered once there is a toast to put in it, so waiting for it is a deadlock:
 * no toast until the container, no container until a toast. `.Toastify` is the
 * outer wrapper and appears as soon as the component mounts. (The stylesheet
 * next door targets `__toast-container` quite correctly — by then a toast
 * exists.)
 */
function whenContainerReady(fire: () => void) {
  let cancelled = false;
  let timer = 0;
  const tick = () => {
    if (cancelled) return;
    if (document.querySelector('.Toastify')) {
      fire();
      return;
    }
    timer = window.setTimeout(tick, 80);
  };
  tick();
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

/**
 * The status mark, the sentence, then the action.
 *
 * **The mark is rendered here rather than in the card's own icon slot**, which
 * is the only way to change it: `Toast.tsx` calls `getToastIcon(type)` itself
 * and takes no icon prop, and the container passes `icon={false}`, which turns
 * off react-toastify's icon and not the house one. So the slot glyph is hidden
 * in the stylesheet and the mark moves into the content, where this file can
 * choose it.
 *
 * **Outlined, at the 18px it ships at.** `InfoCircleIconOutlined` is already in
 * `components/icons` beside the filled `InfoCircleIcon` the card defaults to.
 * With the action now a solid brand button, a filled brand disc made two blue
 * blobs on one small card and the louder of them was the one you cannot press.
 * The filled thing should be the action; the mark that says what kind of
 * message this is can be a line.
 *
 * **A bordered `Button`, at the smallest size on the scale.** The product draws
 * an action inside a tinted info band two ways: `JobAlertIndicator` — a quiet
 * one-line strip, the closest thing to this card — makes it a text link, and
 * `JobAlertShell` makes it `style="border" variant="primary"`. This takes the
 * second. Bordered rather than filled because the toast is a standing notice,
 * not a demand: it should be pressable at a glance without being the loudest
 * thing on the page.
 *
 * **Filled, at the smallest size on the scale** — "primary but small": keep the
 * rank the only action on the card deserves, and spend the *size* to stop it
 * claiming more of a 40px card than it should. Bordered was the wrong knob to
 * turn: it dropped the rank to make the button quieter against the page, when
 * what needed reducing was its size. There is nothing else to press on this
 * card, so there is nothing for it to be secondary to.
 *
 * The flat DS fill, not the glossy primary that 21 production files hand-roll
 * on top of it — that treatment is for a page's own CTA, and three shadows
 * under a 26px button inside a floating card is a third object's worth of
 * depth in something already lifted off the page.
 */
function ToastBody({ sentence, onReload }: { sentence: string; onReload: () => void }) {
  return (
    <span className={s.toastBody}>
      <InfoCircleIconOutlined className={s.toastIcon} />
      <span className={s.toastSentence}>{sentence}</span>
      <Button size="xxs" style="fill" variant="primary" onClick={onReload}>
        Reload
      </Button>
    </span>
  );
}

export default function AppUpdateToastPrototype() {
  const [draft, setDraft] = useState(mockAboutDraft);
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const dirty = editing && draft !== mockAboutDraft;

  /* Read at press time rather than closed over, so the toast's handler can be
     stable and never goes stale against what is typed after it was fired. */
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const handleReload = useCallback(() => {
    if (dirtyRef.current) {
      setLeaving(true);
      return;
    }
    window.location.reload();
  }, []);

  /**
   * The toast stands down while the leave prompt is up.
   *
   * Found by rendering, not by reading: `ToastContainer.module.scss` sets
   * `z-index: 10000` and `UnsavedChangesPrompt`'s overlay is below it, so the
   * toast paints *over* the modal scrim — bright, and arguing with the question
   * it just caused. It has also said everything it has to say by then: the
   * person pressed Reload, and the prompt is the answer. It comes back on
   * Continue Editing, because the build is still stale.
   *
   * In production this is one line next to whatever owns the prompt, not a
   * z-index change — raising the modal above 10000 would put it over every
   * other toast too, including the ones that report why a save failed.
   */
  useEffect(() => {
    if (leaving) {
      rtToast.dismiss(TOAST_ID);
      return;
    }
    return whenContainerReady(() =>
      toast.info(<ToastBody sentence="The Directory has been updated." onReload={handleReload} />, {
        toastId: TOAST_ID,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }),
    );
  }, [leaving, handleReload]);

  /* The container is the app's, not this page's — a toast left behind would
     follow the reviewer onto the next prototype. */
  useEffect(() => () => rtToast.dismiss(TOAST_ID), []);

  return (
    /* The marker the stylesheet's container rules key off — the size override
       and the DEVIATION note there. The container is mounted by the root
       layout, outside this tree, so no ancestor selector can reach it. */
    <div className={s.root} data-app-update-toast>
      <PrototypeNavBar hasUnreadNews={false} />

      {/* Review instrument, not product UI — it narrates, which product copy
          may not. At the top because the subject is pinned to the bottom. One
          sentence and no control: there is a single state, and it is the one
          already on screen. */}
      <div className={s.band}>
        <p className={s.readout}>{reviewNote}</p>
      </div>

      <main className={s.page}>
        <header className={s.profile}>
          <div className={s.avatar} aria-hidden="true">
            {mockMember.name.charAt(0)}
          </div>
          <div>
            <h1 className={s.name}>{mockMember.name}</h1>
            <p className={s.meta}>
              {mockMember.role} · {mockMember.team}
            </p>
          </div>
        </header>

        {/* The one real form, so "unsaved changes" is a state and not a claim. */}
        <section className={`${s.card} ${editing ? s.cardEditing : ''}`}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>About</h2>
            {!editing && (
              <Button size="xs" style="link" variant="primary" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <>
              <textarea
                className={s.textarea}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                aria-label="About"
              />
              <div className={s.cardActions}>
                <Button
                  size="s"
                  style="border"
                  variant="neutral"
                  onClick={() => {
                    setDraft(mockAboutDraft);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button size="s" style="fill" variant="primary" onClick={() => setEditing(false)} disabled={!dirty}>
                  Save
                </Button>
              </div>
              {dirty && <p className={s.dirtyNote}>Unsaved — pressing Reload in the toast now has to ask first.</p>}
            </>
          ) : (
            <p className={s.body}>{draft}</p>
          )}
        </section>

        {mockFillerSections.map((section) => (
          <section key={section.title} className={s.card}>
            <h2 className={s.cardTitle}>{section.title}</h2>
            <ul className={s.rows}>
              {section.rows.map((row) => (
                <li key={row} className={s.row}>
                  {row}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <UnsavedChangesPrompt
        show={leaving}
        onConfirm={() => window.location.reload()}
        onCancel={() => setLeaving(false)}
      />
    </div>
  );
}
