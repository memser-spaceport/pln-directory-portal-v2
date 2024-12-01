import Suggestions from '@/components/form/suggestions';
import CustomCheckbox from '@/components/form/custom-checkbox';
import HiddenField from '@/components/form/hidden-field';
import MultiSelect from '@/components/form/multi-select';
import TextField from '@/components/form/text-field';
import { getSkillsData } from '@/services/sign-up.service';
import { triggerLoader } from '@/utils/common.utils';
import React, { useRef, useState } from 'react';
import { SIGN_UP } from '@/utils/constants';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';

const SignUpInputs = ({ skillsInfo, errors }: any) => {
  const [savedImage, setSavedImage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [skillsOptions, setSkillsOptions] = useState(skillsInfo);

  const uploadImageRef = useRef<HTMLInputElement>(null);
  const formImage = profileImage ? profileImage : savedImage ? savedImage : '';

  const [selectedSkills, setSelectedSkills] = useState<any>([]);

  const analytics = useSignUpAnalytics();

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

  const onPolicyClick = () => {
    analytics.recordURLClick(SIGN_UP.POLICY_URL);
  };

  return (
    <>
      <div className="signup">
        <div>
          <div className="signup__user">
            <div className="signup__user__cn">
              <label htmlFor="member-image-upload" className="signup__user__cn__profile">
                {!profileImage && !savedImage && <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />}
                {!profileImage && !savedImage && <span className="signup__user__cn__profile__text">Add Image</span>}
                {(profileImage || savedImage) && <img className="signup__user__cn__profile__preview" src={formImage} alt="member profile" width="95" height="95" />}
                {(profileImage || savedImage) && (
                  <span className="signup__user__cn__profile__actions">
                    <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                    <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                  </span>
                )}
              </label>
              {errors?.profile && <div className="signup__form__error">{errors.profile}</div>}
              <input readOnly id="member-info-basic-image" value={formImage} hidden name="imageFile" />
              <input data-testid="member-image-upload" onChange={onImageUpload} id="member-image-upload" ref={uploadImageRef} name="memberProfile" hidden type="file" accept="image/png, image/jpeg" />
            </div>
            <div className="signup__form__item">
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
              {errors?.name && <div className="signup__form__error">{errors.name}</div>}
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a squared image in PNG or JPEG format only</span>
          </p>
        </div>
        <div className="signup__form__item">
          <TextField defaultValue={''} isMandatory={true} id="signup-email" label="Email*" name="email" type="email" placeholder="Enter your email address" data-testid="member-email-input" />
          {errors?.email && <div className="signup__form__error">{errors.email}</div>}
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
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Type atleast 3 characters to see suggestions.</span>
          </p>
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
        <div className="signup__consent">
          <CustomCheckbox name="consent" value={'true'} initialValue={false} disabled={false} onSelect={() => {}} />
          <span>I consent to the collection, use, and sharing of my data as per <a target='_blank' href={SIGN_UP.POLICY_URL} onClick={onPolicyClick}>PL policy</a>.</span>
        </div>
        <div className="signup__consent">
          <CustomCheckbox name="subscribe" value={'true'} initialValue={false} disabled={false} onSelect={() => {}} />
          <span>Subscribe to PL Newsletter</span>
        </div>
      </div>
      <style jsx>{`
        .signup {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .signup__user {
          display: flex;
          flex-direction: row;
          width: 100%;
          gap: 20px;
        }
          a {
  color: blue;
  text-decoration: underline;
}

        .signup__form__item {
          margin: 10px 0;
          flex: 1;
        }

        .signup__user__profile {
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

        .signup__user__profile__text {
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

        .signup__consent {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 12px;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
        }

        .signup__form__error {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: red;
        }

        .signup__user__cn{
          max-width: 100px;
        }

        .signup__user__cn__profile {
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

        .signup__user__cn__profile {
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
        .signup__user__cn__profile__actions {
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
        .signup__user__cn__profile__preview {
          border-radius: 50%;
          object-fit: cover;
          object-position: top;
        }
      `}</style>
    </>
  );
};

export default SignUpInputs;
