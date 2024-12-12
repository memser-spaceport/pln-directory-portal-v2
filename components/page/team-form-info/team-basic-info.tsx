'use client';
import TextArea from '@/components/form/text-area';
import TextField from '@/components/form/text-field';
import TextEditor from '@/components/ui/text-editor';
import { useEffect, useRef, useState } from 'react';

interface ITeamBasicInfo {
  errors: string[];
  initialValues: any;
  isEdit?: boolean;
  longDesc: string;
  setLongDesc: (content: string) => void;
}

function TeamBasicInfo(props: ITeamBasicInfo) {
  const errors = props?.errors;
  const initialValues = props?.initialValues;
  const isEdit = props.isEdit ?? false;
  const [savedImage, setSavedImage] = useState<string>(initialValues?.imageFile ?? '')
  const [profileImage, setProfileImage] = useState<string>('');
  const formImage = profileImage ? profileImage : savedImage ? savedImage : ''
  const uploadImageRef = useRef<HTMLInputElement>(null);
  
  const onImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDeleteImage = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setProfileImage('');
    setSavedImage('')
    if (uploadImageRef.current) {
      uploadImageRef.current.value = '';
    }
  };

  useEffect(() => {
    setSavedImage(initialValues?.imageFile ?? '')
    setProfileImage('');
    function resetHandler() {
      if (uploadImageRef.current) {
        uploadImageRef.current.value = '';
        setSavedImage(initialValues?.imageFile ?? '')
        setProfileImage('');
      }
    }
    document.addEventListener('reset-team-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-team-register-form', resetHandler);
    };
  }, [initialValues]);

  return (
    <>
      <div className="teaminfo__form">
        {errors.length > 0 && (
          <ul className="teaminfo__form__errs">
            {errors.map((error:string, index: number) => {
              return (
                <li className="teaminfo__form__errs__err" key={`team-err-${index}`}>
                  {error}
                </li>
              );
            })}
          </ul>
        )}
        {!isEdit && <div className="teaminfo__form__email">
          <TextField
            defaultValue={initialValues.requestorEmail}
            isMandatory={true}
            id="register-team-requestor-email"
            label="Requestor's email*"
            name="requestorEmail"
            type="email"
            placeholder="Enter your email address"
          />
        </div>}
        <div className="teaminfo__form__item">
          <div className="teaminfo__form__team">
            <div>
              <label htmlFor="team-image-upload" className="teaminfo__form__team__profile">
                {(!profileImage && !savedImage) && <img width="32" height="32" alt="upload team image" src="/icons/camera.svg" />}
                {(!profileImage && !savedImage) && <span className="teaminfo__form__team__profile__text">Add Image</span>}
                {(profileImage || savedImage) && <img className="teaminfo__form__team__profile__preview" src={formImage} alt="team profile" width="95" height="95" />}
                {(profileImage || savedImage) && (
                  <span className="teaminfo__form__team__profile__actions">
                    <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                    <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                  </span>
                )}
              </label>
              
              <input readOnly id="team-info-basic-image" value={formImage} hidden name="imageFile"  />
              <input data-testid="team-image-upload" onChange={onImageUpload} id="team-image-upload" ref={uploadImageRef} name="teamProfile" hidden type="file" accept="image/png, image/jpeg" /> 
            </div>
            <div className="teaminfo__form__item">
              <TextField
                defaultValue={initialValues?.name}
                maxLength={150}
                isMandatory
                id="register-team-name"
                label="What is your organization, company, or team name?*"
                name="name"
                type="text"
                placeholder="Enter name here"
              />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a squared image in PNG or JPEG format with file size less than 4MB.</span>
          </p>
        </div>

        <div className="teaminfo__form__item">
          <TextArea
            defaultValue={initialValues?.shortDescription}
            maxLength={1000}
            isMandatory
            id="register-team-shortDescription"
            name="shortDescription"
            label="Briefly describe what your team/product/project does*"
            placeholder="Enter your short elevator pitch here"
          />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">One to two sentences is perfect! Use clear language and minimal jargon.</span>
          </p>
        </div>
        <div className="teaminfo__form__item">
          {
            <label className={`tf__label`}>
              Long Description*
            </label>
          }
          <TextEditor text={props?.longDesc} setContent={props.setLongDesc} id="register-team-longDescription" />
          {/* <TextArea
            defaultValue={initialValues?.longDescription}
            maxLength={2000}
            isMandatory
            id="register-team-longDescription"
            name="longDescription"
            label="Long description*"
            placeholder="Elaborate on your elevator pitch here"
          /> */}
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">Please explain what your team does in a bit more detail. 4-5 sentences will be great!</span>
          </p>
        </div>
        <div className="teaminfo__form__item">
          <TextField
            defaultValue={initialValues?.officeHours}
            isMandatory={false}
            id="register-team-officeHours"
            label="Team office hours"
            name="officeHours"
            type="text"
            placeholder="Enter link here"
          />
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
            <span className="info__text">If your team offers group office hours or open meetings that are open to the public, please share the link so PLN people can join and learn more.</span>
          </p>
        </div>
      </div>
      <style jsx>
        {`
        .tf__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .teaminfo__form {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px 0;
          }
          .teaminfo__form__item {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .teaminfo__form__team {
            display: flex;
            gap: 20px;
            width: 100%;
          }
          .teaminfo__form__team__profile {
            width: 100px;
            height: 100px;
            border: 3px solid #cbd5e1;
            background: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50px;
            color: #156ff7;
            font-size: 12px;
          }
          .teaminfo__form__errs {
            display: grid;
            gap: 4px;
            padding-left: 16px;
          }
          .teaminfo__form__errs__err {
            color: #ef4444;
            font-size: 12px;
            line-height: 16px;
          }
          .teaminfo__form__team__profile {
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
          .teaminfo__form__team__profile__actions {
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
          .teaminfo__form__team__profile__preview {
            border-radius: 50%;
            object-fit: cover;
            object-position: top;
          }
          .info {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .info__text {
            text-align: left;
            font-size: 13px;
            opacity: 40%;
            color: #0f172a;
            font-weight: 500;
            line-height: 18px;
          }
        `}
      </style>
    </>
  );
}

export default TeamBasicInfo;
