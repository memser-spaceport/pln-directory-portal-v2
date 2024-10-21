/**
 * MemberBasicInfo component for displaying and editing member information.
 * This component allows users to upload a profile image, update their name,
 * email, join date, city, state, and country.
 */

'use client';
import TextField from '@/components/form/text-field';
import { useEffect, useRef, useState } from 'react';
import LinkAuthAccounts from './link-auth-accounts';
import SelfEmailUpdate from './self-email-update';
import AdminEmailUpdate from './admin-email-update';

interface MemberBasicInfoProps {
  errors: string[];
  initialValues: any;
  isMemberSelfEdit?: boolean;
  isAdminEdit?: boolean;
  uid?: string;
}

function MemberBasicInfo(props: MemberBasicInfoProps) {
  const errors = props.errors;
  const initialValues = props.initialValues;
  const isMemberSelfEdit = props.isMemberSelfEdit ?? false;
  const isAdminEdit = props.isAdminEdit ?? false;
  const uid = props.uid;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [savedImage, setSavedImage] = useState<string>(initialValues?.imageFile ?? '');
  const [profileImage, setProfileImage] = useState<string>('');
  const formImage = profileImage ? profileImage : savedImage ? savedImage : '';

  /**
   * Handles image upload and sets the profile image state.
   * @param event - The change event from the file input.
   */
  const onImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Deletes the uploaded image and resets the image state.
   * @param e - The pointer event from the delete image action.
   */
  const onDeleteImage = (e: React.PointerEvent<HTMLImageElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setProfileImage('');
    setSavedImage('');
    if (uploadImageRef.current) {
      uploadImageRef.current.value = '';
    }
  };

  useEffect(() => {
    setSavedImage(initialValues?.imageFile ?? '');
    setProfileImage('');
    function resetHandler() {
      if (uploadImageRef.current) {
        uploadImageRef.current.value = '';
        setSavedImage(initialValues?.imageFile ?? '');
        setProfileImage('');
      }
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [initialValues]);

  return (
    <>
      <div className="memberinfo" data-testid="member-basic-info">
        <ul className="memberinfo__errors">
          {errors.map((error: string, index: number) => (
            <li key={`member-error-${index}`}>{error}</li>
          ))}
        </ul>
        <div className="memberinfo__form">
          <div className="memberinfo__form__user">
            <label htmlFor="member-image-upload" className="memberinfo__form__user__profile" data-testid="profile-image-upload">
              {(!profileImage && !savedImage) && <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />}
              {(!profileImage && !savedImage) && <span className="memberinfo__form__user__profile__text">Add Image</span>}
              {(profileImage || savedImage) && <img className="memberinfo__form__user__profile__preview" src={formImage} data-testid="profile-image-preview" alt="user profile" width="95" height="95" />}
              {(profileImage || savedImage) && (
                <span className="memberinfo__form__user__profile__actions">
                  <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                  <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                </span>
              )}
            </label>
            <input type='text' readOnly value={formImage} id="member-info-basic-image" hidden name="imageFile" />
            <input data-testid="member-image-upload" onChange={onImageUpload} id="member-image-upload" name="memberProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
            <div className="memberinfo__form__item">
              <TextField
                pattern="^[a-zA-Z\s]*$"
                maxLength={64}
                isMandatory={true}
                id="register-member-name"
                label="Name*"
                defaultValue={initialValues?.name}
                name="name"
                type="text"
                placeholder="Enter your full name"
                data-testid="member-name-input"
              />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
          </p>
          {!isMemberSelfEdit && !isAdminEdit && (
            <div className="memberinfo__form__item">
              <TextField defaultValue={initialValues.email} isMandatory={true} id="register-member-email" label="Email*" name="email" type="email" placeholder="Enter your email address" data-testid="member-email-input" />
            </div>
          )}

          {isMemberSelfEdit && <SelfEmailUpdate uid={uid} email={initialValues.email} />}
          {isAdminEdit && <AdminEmailUpdate email={initialValues.email} />}
          {isMemberSelfEdit && (
            <div className="memberinfo__form__item">
              <LinkAuthAccounts />
            </div>
          )}
          <div className="memberinfo__form__item">
            <TextField defaultValue={initialValues.plnStartDate} id="register-member-startDate" label="Join date" name="plnStartDate" type="date" placeholder="Enter Start Date" data-testid="member-join-date-input" />
          </div>
          <div className="memberinfo__form__item">
            <TextField defaultValue={initialValues.city} id="register-member-city" label="Metro Area/City" name="city" type="text" placeholder="Enter your metro area or city" data-testid="member-city-input" />
            <p className="info">
              <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
              <span className="info__text">Please share location details to receive invitations for the network events happening in your area.</span>
            </p>
          </div>

          <div className="memberinfo__form__item">
            <div className="memberinfo__form__item__cn">
              <TextField defaultValue={initialValues.region} id="register-member-state" label="State or Province" name="region" type="text" placeholder="Enter state or province" data-testid="member-state-input" />
              <TextField defaultValue={initialValues.country} id="register-member-country" label="Country" name="country" type="text" placeholder="Enter country" data-testid="member-country-input" />
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .info {
            display: flex;
            gap: 4px;
            align-items: center;
            margin-top: 12px;
          }
          .info__text {
            text-align: left;
            font-size: 13px;
            opacity: 0.4;
          }
          .memberinfo__errors {
            color: red;
            font-size: 12px;
            padding: 8px 16px 16px 16px;
          }
          .memberinfo__form {
            display: flex;
            flex-direction: column;
          }
          .memberinfo__form__item {
            margin: 10px 0;
            flex: 1;
          }
          .memberinfo__form__item__cn {
            display: flex;
            gap: 10px;
            width: 100%;
          }

          .memberinfo__form__user {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .memberinfo__form__user__profile {
            width: 100px;
            height: 100px;
            border: 3px solid #cbd5e1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #156ff7;
            font-size: 12px;
            cursor: pointer;
            position: relative;
          }
          .memberinfo__form__user__profile__actions {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border-radius: 50%;
            background: rgb(0, 0, 0, 0.4);
          }

          .memberinfo__form__user__profile__preview {
            border-radius: 50%;
            object-fit: cover;
            object-position: top;
          }
        `}
      </style>
    </>
  );
}

export default MemberBasicInfo;
