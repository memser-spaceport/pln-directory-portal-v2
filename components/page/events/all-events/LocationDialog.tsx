'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { toast } from '@/components/core/ToastContainer';
import { CloseIcon } from '@/components/icons';
import { LocationSelect } from '@/components/ui/LocationSelect';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import type { ResolvedLocation } from '@/services/location.service';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { PERMISSIONS } from '@/services/rbac/constants';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { buildMemberUpdatePayload } from '@/utils/member/buildMemberUpdatePayload';

import l from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput/ProfileLocationInput.module.scss';

import s from './LocationDialog.module.scss';

const PLAA_CODES = [PERMISSIONS.PLAA.PERM_ACCESS, PERMISSIONS.PLAA.PERM_GUEST, PERMISSIONS.PLAA.PERM_MEMBER];

/** Which control opened the dialog (analytics): the no-location row, Near you's "Change", or the no-events row. */
export type LocationDialogFrom = 'add' | 'change' | 'no-events';

/**
 * "Your location" (LAB-3394): the profile's own Location field in the standard modal shell (Modal +
 * SubmitDealModal.module.scss, as the Embed dialog), opened from Events near you. Saving writes the member's profile
 * location, the same city / region / country the profile's Location field writes (`ProfileLocationInput`), through the
 * same full profile save the profile's section editors use: the narrow `PATCH /v1/members/:uid` does not take a
 * location. Then the page refreshes, so Near you follows the new place.
 *
 * Mounted only while open, so each opening starts from the saved location.
 */
export function LocationDialog({
  viewerUid,
  from,
  onClose,
  onSaved,
}: {
  viewerUid: string;
  from: LocationDialogFrom;
  onClose: () => void;
  onSaved: (from: LocationDialogFrom) => void;
}) {
  const router = useRouter();
  const { data: memberData, isFetching, isError } = useMember(viewerUid);
  const memberInfo = memberData && !('isError' in memberData) ? memberData.memberInfo : undefined;
  const loadFailed = !isFetching && (isError || (!!memberData && 'isError' in memberData));
  const { mutateAsync, isPending } = useUpdateMember();
  const { permsSet } = usePermissions();
  const plaa = PLAA_CODES.some((code) => permsSet.has(code));
  const [picked, setPicked] = useState<ResolvedLocation | null>(null);

  const saved = memberInfo?.location;
  const shown = picked
    ? { city: picked.city ?? '', state: picked.metroArea ?? '', country: picked.country ?? '' }
    : { city: saved?.city ?? '', state: saved?.region ?? '', country: saved?.country ?? '' };

  // The save replaces the whole profile record, so it waits for a fresh one: a cached copy could undo a newer edit.
  const canSave = !!picked && !!memberInfo && !isFetching && !isPending;

  // Focus moves into the dialog on open and back to what opened it on close. Modal renders its content one pass after
  // it mounts, so Close takes focus when it attaches (an effect here would run before it exists). On close, Modal's own
  // cleanup, which ends the page's `inert`, runs after this one, and an inert element cannot take focus: hence the wait.
  const [returnTo] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));
  const focusOnAttach = useCallback((node: HTMLButtonElement | null) => node?.focus(), []);
  useEffect(
    () => () => {
      queueMicrotask(() => returnTo instanceof HTMLElement && returnTo.focus());
    },
    [returnTo],
  );

  const save = async () => {
    if (!canSave) return;
    const res = await mutateAsync({
      uid: memberInfo.uid,
      payload: {
        participantType: 'MEMBER',
        referenceUid: memberInfo.uid,
        uniqueIdentifier: memberInfo.email,
        // As the profile's Location field: its "state" is the place's metro area, saved as the region.
        newData: buildMemberUpdatePayload(memberInfo, {
          city: picked.city ?? '',
          region: picked.metroArea ?? '',
          country: picked.country ?? '',
        }),
      },
    }).catch(() => ({ isError: true, errorData: null }));
    if (res?.isError) {
      toast.error(res.errorData?.message || 'Could not save your location');
      return;
    }
    toast.success('Location saved');
    onSaved(from);
    router.refresh();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} ariaLabelledBy="events-location-title" lockScroll inertBackground>
      <div className={`${m.root} ${s.root}`} data-testid="events-location-dialog">
        <div className={m.header}>
          <div className={m.headerText}>
            <h2 id="events-location-title" className={m.title}>
              Your location
            </h2>
            <p className={m.subtitle}>We&apos;ll show upcoming events near you.</p>
          </div>
          <button ref={focusOnAttach} type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>
        <div className={`${m.content} ${s.content}`}>
          <div className={m.fieldGroup}>
            <span className={m.fieldLabel}>Location</span>
            <LocationSelect
              onSelect={setPicked}
              resolvedCity={shown.city}
              resolvedState={shown.state}
              resolvedCountry={shown.country}
            />
            <span className={m.helperText}>This also updates the location on your profile.</span>
            {loadFailed && (
              <span className={m.helperText} role="alert">
                Could not load your profile. Close this and try again.
              </span>
            )}
          </div>
          {plaa && (
            <p className={l.warning} role="note">
              <Link href="/alignment-asset" className={l.link}>
                The PLAA program
              </Link>{' '}
              is limited to certain Geo locations. You may lose access to the page if you change your location.
            </p>
          )}
        </div>
        <div className={`${m.footer} ${s.footer}`}>
          <div className={m.footerActions}>
            <Button style="border" variant="neutral" size="s" onClick={onClose}>
              Cancel
            </Button>
            <Button style="fill" variant="primary" size="s" onClick={() => void save()} disabled={!canSave}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
