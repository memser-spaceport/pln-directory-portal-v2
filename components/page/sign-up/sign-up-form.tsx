'use client';

import { useRef, useState } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import validateCaptcha, { getRecaptchaToken } from '@/services/google-recaptcha.service';
import { toast } from 'react-toastify';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { signUpFormAction } from '@/app/actions/sign-up.actions';
import { useRouter } from 'next/navigation';
import { SIGN_UP } from '@/utils/constants';
import TextField from '@/components/form/text-field';
import SearchWithSuggestions from '@/components/form/suggestions';
import MultiSelect from '@/components/form/multi-select';
import HiddenField from '@/components/form/hidden-field';
import CustomCheckbox from '@/components/form/custom-checkbox';
import Cookies from 'js-cookie';
import { saveRegistrationImage } from '@/services/registration.service';
import { checkEmailDuplicate, formatFormDataToApi, validateSignUpForm } from '@/services/sign-up.service';

/**
 * SignUpForm component handles the user sign-up process.
 *
 * @param {Object} props - The component props.
 * @param {any} props.skillsInfo - Information about the user's skills.
 * @param {Function} props.setSuccessFlag - Function to set the success flag upon form submission.
 *
 * @returns {JSX.Element} The rendered SignUpForm component.
 *
 * @component
 *
 * @example
 * return (
 *   <SignUpForm skillsInfo={skillsInfo} setSuccessFlag={setSuccessFlag} />
 * )
 *
 * @remarks
 * This component uses Google reCAPTCHA for validation and records analytics events
 * during the sign-up process. It also handles form submission and displays any errors
 * that occur during the process.
 */
const SignUpForm = ({ skillsInfo, setSuccessFlag }: any) => {
  const [errors, setErrors] = useState<any>({});

  const formRef = useRef<HTMLFormElement>(null);
  const analytics = useSignUpAnalytics();

  const [savedImage, setSavedImage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [skillsOptions, setSkillsOptions] = useState(skillsInfo);
  const [selectedSkills, setSelectedSkills] = useState<any>([]);
  const [consent, setConsent] = useState(true);

  const uploadImageRef = useRef<HTMLInputElement>(null);
  const formImage = profileImage ? profileImage : savedImage ? savedImage : '';

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    analytics.recordSignUpSave('submit-clicked');
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      triggerLoader(true);
      const reCAPTCHAToken = await getRecaptchaToken();

      // Validating reCAPTCHAToken
      if (reCAPTCHAToken.error || !reCAPTCHAToken.token) {
        toast.error('Google reCAPTCHA validation failed. Please try again.');
        analytics.recordSignUpSave('submit-clicked-captcha-failed', Object.fromEntries(formData.entries()));
        triggerLoader(false);
        return;
      }

      // Adding sign-up source to form data
      if (document?.referrer) {
        formData.append('signUpSource', document?.referrer);
      }

      analytics.recordSignUpSave('submit-clicked', Object.fromEntries(formData.entries()));

      // const formDataObj = Object.fromEntries(formData.entries());
      const campaign = Cookies.get('utm_campaign') ?? '';
      const source = Cookies.get('utm_source') ?? '';
      const medium = Cookies.get('utm_medium') ?? '';
      const cookiesValue = {
        signUpMedium: medium,
        signUpCampaign: campaign,
        signUpSource: source,
      };

      let formattedObj;
      formattedObj = formatFormDataToApi(Object.fromEntries(formData.entries()), cookiesValue);

      let errors: any = validateSignUpForm(formattedObj);

      if (Object.entries(errors).length) {
        setErrors(errors);
      } else {
        const isEmailValid = await checkEmailDuplicate(formattedObj.email);
        if (Object.entries(isEmailValid).length) {
          setErrors(errors);
        } else {
          if (formattedObj.memberProfile && formattedObj.memberProfile.size > 0) {
            try {
              // Uploads the member profile image into s3 and attaches the imageUid and imageUrl
              const imgResponse = await saveRegistrationImage(formattedObj.memberProfile);
              const image = imgResponse?.image;
              formattedObj.imageUid = image.uid;
              formattedObj.imageUrl = image.url;
              delete formattedObj.memberProfile;
            } catch (er) {
              // Returns an error message if the image upload fails
              toast.error('Image upload failed.Please retry again later!');
            }
          }
          formattedObj.memberProfile && delete formattedObj.memberProfile;
          formattedObj.imageFile && delete formattedObj.imageFile;

          // Submitting form data (Implemented actions to evaluate and submit the request)
          // const result = await signUpFormAction(formData, reCAPTCHAToken.token);
          const result = await signUpFormAction(formattedObj, reCAPTCHAToken.token);

          if (result?.success) {
            analytics.recordSignUpSave('submit-clicked-success', Object.fromEntries(formData.entries()));
            setSuccessFlag(true);
            window.scrollTo(0, 0);
          } else {
            // if (result?.errors) {
            //   analytics.recordSignUpSave('submit-clicked-fail', result?.errors);
            //   setErrors(result?.errors);
            // } else {
              if (result?.message) {
                toast.error(result?.message);
              } else {
                toast.error('Something went wrong. Please try again.');
              }
            // }
          }
        }
      }
    } catch (error) {
      analytics.recordSignUpSave('submit-clicked-fail', error);
      console.error(error);
    } finally {
      triggerLoader(false);
    }
  };

  /**
   * Handles the cancel action during the sign-up process.
   *
   * This function performs the following actions:
   * 1. Records the sign-up cancellation event using the analytics service.
   * 2. Redirects the user to the home page.
   *
   * @returns {void}
   */
  const handleCancel = () => {
    analytics.recordSignUpCancel();
    router.push('/');
  };

  /**
   * Adds a new skill to the selected skills list.
   *
   * @param {any} newSelectedOption - The new skill to be added to the selected skills list.
   */
  const onAddSkill = (newSelectedOption: any) => {
    setSelectedSkills((v: any[]) => {
      return [...v, newSelectedOption];
    });
  };

  /**
   * Removes a skill from the selected skills list.
   *
   * @param item - The skill item to be removed. It should have an `id` property.
   */
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
      if (file.size >= 4 * 1024 * 1024) {
        setErrors({ profile: 'File size should be less than 4MB.' });
        return;
      } else {
        if (errors?.profile) {
          const temperrors = { ...errors };
          delete temperrors.profile;
          setErrors({ ...temperrors });
        }
      }
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

  /**
   * Handles the click event for the policy link.
   * Records the URL click event for analytics purposes.
   *
   */
  const onPolicyClick = () => {
    analytics.recordURLClick(SIGN_UP.POLICY_URL);
  };

  return (
    <>
      <form onSubmit={handleSubmit} ref={formRef} noValidate className="signup__form__cn">
        <div className="signup__form__cn__inputs">
          <div className="signup">
            <div>
              <div className="signup__user">
                {/* Member profile image upload */}
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
                  <input readOnly id="member-info-basic-image" value={formImage} hidden name="imageFile" />
                  <input
                    data-testid="member-image-upload"
                    onChange={onImageUpload}
                    id="member-image-upload"
                    ref={uploadImageRef}
                    name="memberProfile"
                    hidden
                    type="file"
                    accept="image/png, image/jpeg"
                  />
                </div>

                {/* Member name */}
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

              {/* Image validation error */}
              {errors?.profile && <div className="signup__form__error">{errors.profile}</div>}
              <p className="info">
                <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB.</span>
              </p>
            </div>

            {/* Member Email */}
            <div className="signup__form__item">
              <TextField defaultValue={''} isMandatory={true} id="signup-email" label="Email*" name="email" type="email" placeholder="Enter your email address" data-testid="member-email-input" />
              {errors?.email && <div className="signup__form__error">{errors.email}</div>}
            </div>

            {/* Search team or project associated with member */}
            <div>
              <SearchWithSuggestions
                addNew={{
                  enable: true,
                  title: 'Not able to find your project or team?',
                  actionString: 'Share URL instead',
                  iconURL: '/icons/sign-up/share.svg',
                  placeHolderText: 'Enter or paste URL here',
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

            {/* Member skills */}
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

            {/* consent input */}
            <div className="signup__checkbox__cn">
              <div className="signup__checkbox">
                <CustomCheckbox
                  name="consent"
                  value={'true'}
                  initialValue={true}
                  disabled={false}
                  onSelect={() => {
                    setConsent(!consent);
                  }}
                />
                <span>
                  I agree to Protocol Labs&apos;{' '}
                  <a target="_blank" href={SIGN_UP.POLICY_URL} onClick={onPolicyClick}>
                    Terms of Service and Privacy Policy
                  </a>
                  .
                </span>
              </div>
              <p className="info">
                <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
                <span className="info__text">
                  You also allow Protocol Labs and companies within the network to contact you for events and opportunities within the network. Your information may only be shared with verified
                  network people and will not be available to any individuals or entities outside the network.
                </span>
              </p>
            </div>

            {/* subscription input */}
            <div className="signup__checkbox">
              <CustomCheckbox name="subscribe" value={'true'} initialValue={true} onSelect={() => {}} />
              <span>Subscribe to PL Newsletter</span>
            </div>
          </div>
        </div>
        <div className="signup__form__cn__actions">
          <div className="sign-up-actions__cn">
            <button type="button" onClick={handleCancel} className="sign-up-actions__cn__cancel">
              Cancel
            </button>
            <button type="submit" className="sign-up-actions__cn__submit" disabled={!consent}>
              Sign up
            </button>
          </div>
        </div>
      </form>
      <style jsx>{`
        .signup__form__cn {
          width: 100%;
        }
        .signup__form__cn__inputs {
          display: flex;
          padding: 26px 44px;
          width: 100%;
          flex-direction: column;
        }
        .sign-up-actions__cn {
          display: flex;
          justify-content: flex-end;
          padding: 16px 32px;
          gap: 8px;
          border-top: 1px solid #cbd5e1;
        }
        .sign-up-actions__cn__submit {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #156ff7;
          cursor: pointer;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .sign-up-actions__cn__cancel {
          padding: 10px 24px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

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

        .sign-up-actions__cn__submit:disabled {
          background: #cbd5e1;
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

        .signup__checkbox {
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

        .signup__user__cn {
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

        .signup__checkbox_cn {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-direction: row;
        }
      `}</style>
    </>
  );
};

export default SignUpForm;
