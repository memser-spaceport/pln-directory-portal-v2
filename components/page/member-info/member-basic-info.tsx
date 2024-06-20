import TextField from '@/components/form/text-field';
import { useRef, useState } from 'react';

function MemberBasicInfo(props) {
  const errors = props.errors;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string>('');
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

  const onDeleteImage = (e: React.ChangeEvent<HTMLImageElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setProfileImage('');
  };

  return (
    <>
      <div className="memberinfo">
        <ul className="memberinfo__errors">
          {errors.map((error: string, index: number) => (
            <li key={`member-error-${index}`}>{error}</li>
          ))}
        </ul>
        <div className="memberinfo__form">
          <div className="memberinfo__form__user">
            <label htmlFor="member-image-upload" className="memberinfo__form__user__profile">
              {!profileImage && <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />}
              {!profileImage && <span className="memberinfo__form__user__profile__text">Add Image</span>}
              {profileImage && <img className="memberinfo__form__user__profile__preview" src={profileImage} alt="user profile" width="95" height="95" />}
              {profileImage && (
                <span className="memberinfo__form__user__profile__actions">
                  <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                  <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                </span>
              )}
            </label>
            <input onChange={onImageUpload} id="member-image-upload" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
            {profileImage && <input hidden name="profileimage" value={profileImage} />}
            <div className="memberinfo__form__item">
              <TextField isMandatory={true} id="register-member-name" label="Name*" name="name" type="text" placeholder="Enter your full name" />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
          </p>
          <div className="memberinfo__form__item">
            <TextField isMandatory={true} id="register-member-email" label="Email*" name="email" type="email" placeholder="Enter your email address" />
          </div>
          <div className="memberinfo__form__item">
            <TextField id="register-member-startDate" label="PLN Join Date" name="plnStartDate" type="date" placeholder="Enter Start Date" />
          </div>
          <div className="memberinfo__form__item">
            <TextField id="register-member-city" label="City" name="city" type="text" placeholder="Enter your city" />
            <p className="info">
              <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
              <span className="info__text">Please share location details to receive invitations for the network events happening in your area.</span>
            </p>
          </div>

          <div className="memberinfo__form__item">
            <div className="memberinfo__form__item__cn">
              <TextField id="register-member-state" label="State or Province" name="region" type="text" placeholder="Enter state or province" />
              <TextField id="register-member-country" label="Country" name="country" type="text" placeholder="Enter country" />
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
            padding: 0 16px 16px 16px;
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
