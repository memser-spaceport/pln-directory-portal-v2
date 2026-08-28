'use client';

import { useEffect, useState } from 'react';

import { useUpdateEmail } from '@/services/members/hooks/useUpdateEmail';
import { useCurrentUserStore } from '@/services/auth/store';

function SelfEmailUpdate(props: any) {
  const email = props.email;
  const uid = props.uid;
  const [currentEmail, setCurrentEmail] = useState(email);
  const { currentUser: userInfo } = useCurrentUserStore();
  // Errors surface as toasts here: this row is a bare label and value, with nowhere to put one.
  const { requestEmailChange } = useUpdateEmail({ uid, email, userInfo, source: 'member-profile' });

  const onEmailEdit = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    requestEmailChange();
  };

  useEffect(() => {
    setCurrentEmail(email);
  }, [email]);

  return (
    <>
      <div className="eu">
        <div className="eu__head">
          <label className="eu__head__label">Email*</label>
          <button className="eu__head__btn" onClick={onEmailEdit} type="button">
            Edit Email
          </button>
        </div>
        <p className="eu__input">{email}</p>
        <input name="email" type="email" hidden value={currentEmail} readOnly />
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
        `}
      </style>
    </>
  );
}

export default SelfEmailUpdate;
