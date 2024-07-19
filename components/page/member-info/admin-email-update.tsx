import React, { useRef, useState, useEffect } from 'react';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { getUserInfo } from '@/utils/third-party.helper';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

type EmailUpdateProps = {
  email: string;
};

const AdminEmailUpdate: React.FC<EmailUpdateProps> = ({ email }) => {
  const newEmailRef = useRef<HTMLInputElement>(null);
  const confirmEmailRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const analytics = useSettingsAnalytics();

  const userInfo = getUserInfo();

  const checkEmailsMatch = () => {
    const newEmail = newEmailRef.current?.value || '';
    const confirmEmail = confirmEmailRef.current?.value || '';
    if (newEmail && confirmEmail) {
      setError(newEmail === confirmEmail ? '' : 'Emails do not match.');
    } else {
      setError('');
    }
  };

  useEffect(() => {
    setIsEditing(false);
  }, [email]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    analytics.recordMemberEmailAdminEditClick(email, getAnalyticsUserInfo(userInfo));
    setIsEditing(true);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    analytics.recordMemberEmailAdminEditCancel(email, getAnalyticsUserInfo(userInfo));
    if (newEmailRef.current) newEmailRef.current.value = '';
    if (confirmEmailRef.current) confirmEmailRef.current.value = '';
    setError('');
    setIsEditing(false);
  };

  const handleInputChange = () => {
    checkEmailsMatch();
  };

  return (
    <>
      <div>
        {!isEditing ? (
          <div className="eu">
            <div className="eu__head">
              <p className="eu__head__label">Email*</p>
              <button className="eu__head__btn" onClick={handleEditClick}>
                Edit Email
              </button>
            </div>
            <p className="eu__input">{email}</p>
            <input name="email" type="email" readOnly hidden value={email} />
          </div>
        ) : (
          <div className="eu">
            <div className="eu__head">
              <p className="eu__head__label">Enter New Email*</p>
              <button className="eu__head__btn" onClick={handleCancelClick}>
                Cancel
              </button>
            </div>
            <div className="eu__emails">
              <input
                className="eu__emails__input"
                type="email"
                placeholder="Enter new email"
                ref={newEmailRef}
                onChange={handleInputChange}
              />
              <input
                className="eu__emails__input"
                type="email"
                placeholder="Confirm new email"
                ref={confirmEmailRef}
                onChange={handleInputChange}
                onPaste={(e) => e.preventDefault()}
                autoComplete="off"
              />
              {error && <p className="eu__emails__error">{error}</p>}
            </div>
            <input
              name="email"
              hidden
              type="email"
              value={newEmailRef.current?.value === confirmEmailRef.current?.value && newEmailRef.current?.value ? newEmailRef.current?.value : ''}
            />
          </div>
        )}
      </div>
      <style jsx>
        {`
          .eu {
            padding: 12px 0;
          }
          .eu__head {
            display: flex;
            justify-content: space-between;
          }
          .eu__head__btn {
            background: white;
            color: #156ff7;
            font-weight: 500;
          }
          .eu__head__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .eu__input {
            border: 1px solid lightgrey;
            height: 40px;
            padding: 8px 12px;
            font-size: 14px;
            display: flex;
            align-items: center;
            border-radius: 8px;
            background: #eaeaea;
          }
          .eu__emails {
            width: 100%;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
            .eu__emails__error {
              color: #ff0000;
              font-size: 12px;
              line-height: 12px;
            }
          .eu__emails__input {
            border: 1px solid lightgrey;
            height: 40px;
            padding: 8px 12px;
            font-size: 14px;
            display: flex;
            align-items: center;
            border-radius: 8px;
            width: 100%;
            outline: none;
          }
          .eu__emails__input:focus {
            outline: none;
          }
          .eu__emails__error {
            color: red;
            margin-top: 8px;
          }
        `}
      </style>
    </>
  );
};

export default AdminEmailUpdate;
