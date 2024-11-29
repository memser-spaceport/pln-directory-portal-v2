import Suggestions from '@/components/form/suggestions';
import CustomCheckbox from '@/components/form/custom-checkbox';
import HiddenField from '@/components/form/hidden-field';
import MultiSelect from '@/components/form/multi-select';
import TextField from '@/components/form/text-field';
import { getSkillsData } from '@/services/sign-up.service';
import { triggerLoader } from '@/utils/common.utils';
import React, { useRef, useState } from 'react';

const SignUpInputs = ({skillsInfo}:any) => {
  const [savedImage, setSavedImage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [skillsOptions, setSkillsOptions] = useState(skillsInfo);

  const uploadImageRef = useRef<HTMLInputElement>(null);
  const formImage = profileImage ? profileImage : savedImage ? savedImage : '';

  const [selectedSkills, setSelectedSkills] = useState<any>([]);

  const onAddSkill = (newSelectedOption: any) => {
    setSelectedSkills((v: any[]) => {
      return [...v, newSelectedOption];
    });
  };

  const onRemoveSkill = (item: any) => {
    setSelectedSkills((old: any[]) => {
      const newItems = [...old].filter((v) => v.id !== item.id);
      return newItems;
    });
  };

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

  return (
    <>
      <div className="ip__cn">
        <div>
        <div className="ip__cn__user">
          <label htmlFor="member-image-upload" className="ip__cn__user__profile" data-testid="profile-image-upload">
            {!profileImage && !savedImage && <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />}
            {!profileImage && !savedImage && <span className="ip__cn__user__profile__text">Add Image</span>}
            {(profileImage || savedImage) && <img className="memberinfo__form__user__profile__preview" src={formImage} data-testid="profile-image-preview" alt="user profile" width="95" height="95" />}
            {(profileImage || savedImage) && (
              <span className="memberinfo__form__user__profile__actions">
                <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
              </span>
            )}
          </label>
          <input type="text" readOnly value={formImage} id="member-info-basic-image" hidden name="imageFile" />
          <input data-testid="member-image-upload" onChange={onImageUpload} id="member-image-upload" name="memberProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
          <div className="ip__cn__form__item">
            <TextField
              pattern="^[a-zA-Z\s]*$"
              maxLength={64}
              isMandatory={true}
              id="register-member-name"
              label="Name*"
              defaultValue={''}
              name="name"
              type="text"
              placeholder="Enter your full name"
              data-testid="member-name-input"
            />
          </div>
        </div>
        <p className="info">
          <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a squared image in PNG or JPEG format only</span>
        </p>
        </div>
        <div className="ip__cn__form__item">
          <TextField defaultValue={''} isMandatory={true} id="signup-email" label="Email*" name="email" type="email" placeholder="Enter your email address" data-testid="member-email-input" />
        </div>
        <div>
          <Suggestions
            suggestions={{
              addSuggestion: {
                enable: true,
                title: 'Not able to find your project or team?',
                actionString: 'Share URL instead',
                iconURL: '/icons/sign-up/share.svg',
                placeHolderText: 'Enter or paste URL here',
              },
            }}
            title={'Select a Team or a Project you are associated with'}
            id={'search-team-and-project'}
            name={'search-team-and-project'}
            placeHolder="Enter a name of your team or project"
          />
        </div>

        <div>
          <MultiSelect
            options={skillsOptions}
            selectedOptions={selectedSkills}
            onAdd={onAddSkill}
            onRemove={onRemoveSkill}
            uniqueKey="id"
            displayKey="name"
            label="Professional skills"
            placeholder="Select applicable skills"
            isMandatory={false}
            closeImgUrl="/icons/close.svg"
            arrowImgUrl="/icons/arrow-down.svg"
          />
          {selectedSkills.map((skillInfo: any, index: number) => (
            <div key={`member-skills-${index}`}>
              <HiddenField value={skillInfo.name} defaultValue={skillInfo.name} name={`skillsInfo${index}-title`} />
              <HiddenField value={skillInfo.id} defaultValue={skillInfo.id} name={`skillsInfo${index}-uid`} />
            </div>
          ))}
        </div>
        <div className="ip__cn__consent">
          <CustomCheckbox name="consent" value={'true'} initialValue={false} disabled={false} onSelect={() => {}} />
          <span>I consent to the collection, use, and sharing of my data as per PL policy.</span>
        </div>
        <div className="ip__cn__consent">
          <CustomCheckbox name="subscribe" value={'true'} initialValue={false} disabled={false} onSelect={() => {}} />
          <span>Subscribe to PL Newsletter</span>
        </div>
      </div>
      <style jsx>{`
        .ip__cn {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ip__cn__user {
          display: flex;
          flex-direction: row;
          width: 100%;
          gap: 20px;
        }

        .ip__cn__form__item {
          margin: 10px 0;
          flex: 1;
        }

        .ip__cn__user__profile {
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

        .ip__cn__user__profile__text {
          font-size: 12px;
          color: #156ff7;
          font-weight: 500;
          line-height: 12px;
          padding-top: 4px;
        }

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

        .ip__cn__consent {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 12px;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
        }
      `}</style>
    </>
  );
};

export default SignUpInputs;
