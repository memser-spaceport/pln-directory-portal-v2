import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/common/Modal';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import s from './FoundersListModal.module.scss';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CaretRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.354 8.35354L6.35403 13.3535C6.30757 13.4 6.25242 13.4368 6.19173 13.462C6.13103 13.4871 6.06598 13.5001 6.00028 13.5001C5.93458 13.5001 5.86953 13.4871 5.80883 13.462C5.74813 13.4368 5.69298 13.4 5.64653 13.3535C5.60007 13.3071 5.56322 13.2519 5.53808 13.1912C5.51294 13.1305 5.5 13.0655 5.5 12.9998C5.5 12.9341 5.51294 12.869 5.53808 12.8083C5.56322 12.7476 5.60007 12.6925 5.64653 12.646L10.2934 7.99979L5.64653 3.35354C5.55271 3.25972 5.5 3.13247 5.5 2.99979C5.5 2.86711 5.55271 2.73986 5.64653 2.64604C5.74035 2.55222 5.8676 2.49951 6.00028 2.49951C6.13296 2.49951 6.26021 2.55222 6.35403 2.64604L11.354 7.64604C11.4005 7.69248 11.4374 7.74762 11.4626 7.80832C11.4877 7.86902 11.5007 7.93408 11.5007 7.99979C11.5007 8.0655 11.4877 8.13056 11.4626 8.19126C11.4374 8.25196 11.4005 8.3071 11.354 8.35354Z"
      fill="#455468"
    />
  </svg>
);

interface Founder {
  uid: string;
  name: string;
  role: string;
  image: { url: string } | null;
  officeHours?: boolean | null;
  skills: Array<{ uid: string; title: string }>;
}

interface FoundersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  founders: Founder[];
}

export const FoundersListModal: React.FC<FoundersListModalProps> = ({ isOpen, onClose, founders }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={s.modal}>
        <div className={s.header}>
          <h2 className={s.title}>Members ({founders.length})</h2>
          <button className={s.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={s.content}>
          <div className={s.membersList}>
            {founders.map((founder, index) => (
              <React.Fragment key={founder.uid}>
                {index > 0 && <div className={s.divider} />}
                <div className={s.memberRow}>
                  <div className={s.memberContent}>
                    <div
                      className={s.memberAvatar}
                      style={{
                        backgroundImage: founder.image?.url
                          ? `url('${founder.image.url}')`
                          : `url('${getDefaultAvatar(founder.name)}')`,
                      }}
                    />
                    <div className={s.memberInfo}>
                      <div className={s.memberNameRole}>
                        <h4 className={s.memberName}>{founder.name}</h4>
                        <p className={s.memberRole}>{founder.role || 'Co-Founder'}</p>
                      </div>
                      {founder.officeHours && <p className={s.memberStatus}>Available to connect</p>}
                    </div>
                    <div className={s.memberBadges}>
                      {founder.skills.slice(0, 3).map((skill) => (
                        <span className={s.memberBadge} key={skill.uid}>
                          {skill.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/members/${founder.uid}`} target="_blank" className={s.memberArrow}>
                    <CaretRightIcon />
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
