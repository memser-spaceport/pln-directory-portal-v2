'use client';

import Link from 'next/link';

import { Modal } from '@/components/common/Modal';
import { useTeamFollowers } from '@/services/follow/hooks/useTeamFollowers';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { PAGE_ROUTES } from '@/utils/constants';
import s from './TeamFollowersModal.module.scss';

interface TeamFollowersModalProps {
  teamName: string;
  teamUid: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamFollowersModal({ teamUid, isOpen, onClose }: TeamFollowersModalProps) {
  const { data, isLoading } = useTeamFollowers(teamUid, { enabled: isOpen });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.head}>
        <span className={s.titleWrap}>
          <h3 className={s.title}>Followers</h3>
          {data && <span className={s.count}>{data.total.toLocaleString()}</span>}
        </span>
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      {isLoading && (
        <div className={s.loading}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={s.skeletonRow}>
              <div className={s.skeletonAvatar} />
              <div className={s.skeletonText}>
                <div className={s.skeletonName} />
                <div className={s.skeletonRole} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <p className={s.empty}>No followers yet.</p>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((follower) => {
            const defaultAvatarImage = getDefaultAvatar(follower.name);

            return (
              <li key={follower.uid} className={s.row}>
                <Link href={`${PAGE_ROUTES.MEMBERS}/${follower.uid}`} className={s.rowLink} onClick={onClose}>
                  <img
                    className={s.rowAvatar}
                    src={follower.image || defaultAvatarImage}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = defaultAvatarImage;
                    }}
                  />
                  <div className={s.rowText}>
                    <span className={s.rowName}>{follower.name}</span>
                    {follower.role && <span className={s.rowRole}>{follower.role}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5l10 10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
