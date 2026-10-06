'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import type { ElementPinsController } from './useElementPins';
import type { ElementPin } from './types';

import s from './ElementPins.module.scss';

interface Props {
  pins: ElementPinsController;
  activePinId: string | null;
  onActivePinChange: (pinId: string | null) => void;
  onContinue: () => void;
  onCancel: () => void;
  onUseScreenshot: () => void;
}

function describe(pin: ElementPin): string {
  const { component, tag, text } = pin.element;
  const label = component ? `${component} · <${tag}>` : `<${tag}>`;
  return text ? `${label} “${text.slice(0, 60)}${text.length > 60 ? '…' : ''}”` : label;
}

/**
 * The docked panel of pin mode. It is NOT a modal: the app beside it has to
 * stay visible and usable — leaving pick mode to open a menu or change route,
 * then picking again, is the flow this exists for.
 */
export function PinPanel({ pins, activePinId, onActivePinChange, onContinue, onCancel, onUseScreenshot }: Props) {
  const noteRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const lastCount = useRef(pins.pins.length);

  /* A new pin takes focus so the member can type its note straight away. */
  useEffect(() => {
    const count = pins.pins.length;
    if (count > lastCount.current) {
      const newest = pins.pins[count - 1];
      noteRefs.current.get(newest.id)?.focus();
      onActivePinChange(newest.id);
    }
    lastCount.current = count;
  }, [pins.pins, onActivePinChange]);

  useEffect(() => {
    if (activePinId) noteRefs.current.get(activePinId)?.focus();
  }, [activePinId]);

  /* Esc here (focus in LabOS) stops picking; Esc inside the app is the bridge's. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !pins.isPicking) return;
      event.preventDefault();
      pins.stopPicking();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pins]);

  const hasPins = pins.pins.length > 0;

  return (
    <aside className={s.panel} aria-label="Pin feedback">
      <div className={s.panelHeader}>
        <h2 className={s.panelTitle}>Pin feedback</h2>
        <button type="button" className={s.iconButton} onClick={onCancel} aria-label="Close pin feedback">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      <div className={s.panelBody}>
        <Button
          size="s"
          variant={pins.isPicking ? 'neutral' : 'primary'}
          style={pins.isPicking ? 'border' : 'fill'}
          onClick={pins.isPicking ? pins.stopPicking : pins.startPicking}
          aria-pressed={pins.isPicking}
          className={s.pickButton}
        >
          {pins.isPicking ? 'Stop picking' : hasPins ? 'Pin another element' : 'Pick an element'}
        </Button>
        <p className={s.hint}>
          {pins.isPicking ? (
            <>
              Click anything in the app.
              <span className={s.keyHint}>
                {' '}
                <kbd className={s.kbd}>⌥</kbd> selects its parent, <kbd className={s.kbd}>Esc</kbd> stops.
              </span>
            </>
          ) : hasPins ? (
            'The app works normally between picks — open a menu or change page, then pin again.'
          ) : (
            'Point at the part of the app your feedback is about. No screen sharing needed.'
          )}
        </p>

        {hasPins && (
          <ol className={s.pinList}>
            {pins.pins.map((pin, i) => (
              <li key={pin.id} className={s.pinItem} data-active={pin.id === activePinId} data-detached={!pin.rect}>
                <div className={s.pinHead}>
                  <span className={s.pinNumber} aria-hidden>
                    {i + 1}
                  </span>
                  <span className={s.pinWhat} title={pin.element.selector}>
                    {describe(pin)}
                  </span>
                  <button
                    type="button"
                    className={s.iconButton}
                    onClick={() => pins.removePin(pin.id)}
                    aria-label={`Remove pin ${i + 1}`}
                  >
                    <CloseIcon width={12} height={12} />
                  </button>
                </div>
                {!pin.rect && <p className={s.detached}>Not on this page anymore — the pin and its note are kept.</p>}
                {pin.crop.status === 'done' && <img className={s.crop} src={pin.crop.dataUrl} alt="" />}
                {pin.crop.status === 'pending' && <div className={s.cropPending} aria-hidden />}
                <textarea
                  ref={(el) => {
                    if (el) noteRefs.current.set(pin.id, el);
                    else noteRefs.current.delete(pin.id);
                  }}
                  className={s.note}
                  rows={2}
                  maxLength={1000}
                  placeholder="What’s wrong here, or what should change?"
                  value={pin.note}
                  onFocus={() => onActivePinChange(pin.id)}
                  onChange={(e) => pins.setNote(pin.id, e.target.value)}
                  aria-label={`Note for pin ${i + 1}`}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={s.panelFooter}>
        <button type="button" className={s.linkButton} onClick={onUseScreenshot}>
          Use a screenshot instead
        </button>
        <div className={s.footerActions}>
          <Button size="s" style="border" variant="neutral" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="s" onClick={onContinue} disabled={!hasPins}>
            Continue
          </Button>
        </div>
      </div>
    </aside>
  );
}
