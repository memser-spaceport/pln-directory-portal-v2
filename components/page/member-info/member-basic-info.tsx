'use client';
import TextField from '@/components/form/text-field';
import HiddenField from '@/components/form/hidden-field';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { useEffect, useRef, useState } from 'react';
import LinkAuthAccounts from './link-auth-accounts';
import SelfEmailUpdate from './self-email-update';
import AdminEmailUpdate from './admin-email-update';
import { getStatesByCountry, getCitiesByCountryAndState, getCountries } from '@/services/location.service';

interface MemberBasicInfoProps {
  errors: string[];
  initialValues: any;
  isMemberSelfEdit?: boolean;
  isAdminEdit?: boolean;
  uid?: string;
  countries: any[];
  isStateRequired: boolean;
  isCityRequired: boolean;
  setIsStateRequired: (isRequired: boolean)=> void;
  setIsCityRequired: (isRequired: boolean)=> void;
}

function MemberBasicInfo(props: MemberBasicInfoProps) {
  const errors = props.errors;
  const countries = props.countries;
  const isStateRequired = props.isStateRequired;
  const isCityRequired = props.isCityRequired;
  const setIsStateRequired = props.setIsStateRequired;
  const setIsCityRequired = props.setIsCityRequired;
  const initialValues = props.initialValues;
  const { country, region, city } = props.initialValues;
  const isMemberSelfEdit = props.isMemberSelfEdit ?? false;
  const isAdminEdit = props.isAdminEdit ?? false;
  const uid = props.uid;
  const uploadImageRef = useRef<HTMLInputElement>(null);
  const [savedImage, setSavedImage] = useState<string>(initialValues?.imageFile ?? '')
  const [profileImage, setProfileImage] = useState<string>('');
  const formImage = profileImage ? profileImage : savedImage ? savedImage : '';
  const [states, setStates] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(country ? { name: country } : null);
  const [selectedState, setSelectedState] = useState<any>(region ? { name: region } : null);
  const [selectedCity, setSelectedCity] = useState<any>(city ? { name: city } : null);

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
    if (country && countries?.length > 0) {
      const currentCountry = countries.find((countryObj) => countryObj.name === country);
      setSelectedCountry(currentCountry);
      updateStatesAndCitiesByCountry(currentCountry);
    }
  }, [props.countries]);

  useEffect(() => {
    setSavedImage(initialValues?.imageFile ?? '')
    setProfileImage('');
    function resetHandler() {
      setSelectedCountry({ name: country });
      setSelectedState({ name: region });
      setSelectedCity({ name: city });
      if (uploadImageRef.current) {
        uploadImageRef.current.value = '';
        setSavedImage(initialValues?.imageFile ?? '')
        setProfileImage('');
      }
      getCountries()
        .then((countries) => {
          if (!countries.isError) {
            const currentCountry = countries.find((countryObj : any) => countryObj.name === country);
            updateStatesAndCitiesByCountry(currentCountry);
          }
      }).catch((e) => console.error(e));
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [initialValues]);

  const updateStatesByCountry = (currentCountry:any) => {
    getStatesByCountry(currentCountry?.iso2)
    .then((states) => {
      if (!states.isError) {
        setStates(states as any);
        if (states.length === 0) {
          setCities([]);
          setIsStateRequired(false);
          setIsCityRequired(false);
        }
      }
    }).catch((e) => console.error(e));
  };

  const updateStatesAndCitiesByCountry = (currentCountry:any) => { 
    getStatesByCountry(currentCountry?.iso2)
    .then((states) => {
      if (!states.isError) {
        setStates(states as any);
        if (states?.length === 0) {
          setIsStateRequired(false);
          setIsCityRequired(false);
          setCities([]);
        } 
        const currentState = states.find((stateObj : any) => stateObj.name === region);
        if (currentState) {
          getCitiesByCountryAndState(currentCountry?.iso2, currentState?.iso2)
          .then((cities) => {
            if (!cities.isError) {
              setCities(cities as any);
              if (cities?.length === 0) {
                setIsCityRequired(false);
              }
            }
          })
          .catch((e) => console.error(e));
        }
      }
    }).catch((e) => console.error(e));
  };

  const onCountrySelectionChanged = async (item:any) => {
    setSelectedCountry(item);
    setSelectedState(null);
    setSelectedCity(null);
    setIsStateRequired(true);
    setIsCityRequired(true);
    updateStatesByCountry(item);
  };

  const onStateSelectionChanged = async (item:any) => {
    setSelectedState(item);
    setSelectedCity(null);
    if (selectedCountry) {
      getCitiesByCountryAndState(selectedCountry?.iso2, item?.iso2)
      .then((cities) => {
        if (!cities.isError) {
          setCities(cities as any);
          if (cities?.length === 0) {
            setIsCityRequired(false);
          }
        }
      })
      .catch((e) => console.error(e));
    }
  };

  const onCitySelectionChanged = (item:any) => {
    setSelectedCity(item);
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
              {(!profileImage && !savedImage) && <img width="32" height="32" alt="upload member image" src="/icons/camera.svg" />}
              {(!profileImage && !savedImage) && <span className="memberinfo__form__user__profile__text">Add Image</span>}
              {(profileImage || savedImage) && <img className="memberinfo__form__user__profile__preview" src={formImage} alt="user profile" width="95" height="95" />}
              {(profileImage || savedImage) && (
                <span className="memberinfo__form__user__profile__actions">
                  <img width="32" height="32" title="Change profile image" alt="change image" src="/icons/recycle.svg" />
                  <img onClick={onDeleteImage} width="32" height="32" title="Delete profile image" alt="delete image" src="/icons/trash.svg" />
                </span>
              )}
            </label>
            <input type='text' readOnly value={formImage} id="member-info-basic-image" hidden name="imageFile" />
            <input onChange={onImageUpload} id="member-image-upload" name="memberProfile" ref={uploadImageRef} hidden type="file" accept="image/png, image/jpeg" />
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
              />
            </div>
          </div>
          <p className="info">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" /> <span className="info__text">Please upload a image in PNG or JPEG format with file size less than 4MB</span>
          </p>
          {!isMemberSelfEdit && !isAdminEdit && (
            <div className="memberinfo__form__item">
              <TextField defaultValue={initialValues.email} isMandatory={true} id="register-member-email" label="Email*" name="email" type="email" placeholder="Enter your email address" />
            </div>
          )}
          {isMemberSelfEdit && <SelfEmailUpdate uid={uid} email={initialValues.email}/>}
          {isAdminEdit && <AdminEmailUpdate email={initialValues.email}/>}
          {isMemberSelfEdit && (
            <div className="memberinfo__form__item">
              <LinkAuthAccounts />
            </div>
          )}
          <div className="memberinfo__form__item">
            <TextField defaultValue={initialValues.plnStartDate} id="register-member-startDate" label="Join date" name="plnStartDate" type="date" placeholder="Enter Start Date" />
          </div>
          <div className="memberinfo__form__item">
            <div className="memberinfo__form__item__cn">
              <div className="memberinfo__form__user__location__country">
                <label id="member-country" className='memberinfo__form__user__location__label'>Country*</label>
                <SearchableSingleSelect
                  id="member-country"
                  isMandatory={true}
                  placeholder="Select country"
                  displayKey="name"
                  options={countries}
                  selectedOption={selectedCountry}
                  uniqueKey="name"
                  formKey="name"
                  name={"country"}
                  onClear={() => {}}
                  onChange={(item) => onCountrySelectionChanged(item)}
                  arrowImgUrl="/icons/arrow-down.svg"
                />
                <HiddenField value={selectedCountry?.name || ''} defaultValue={selectedCountry?.name || ''} name={'country'} />
              </div>
            </div>
          </div>
          <div className="memberinfo__form__item">
            <div className="memberinfo__form__item__cn">
              <div className="memberinfo__form__user__location__state">
                <label id="member-state" className='memberinfo__form__user__location__label'>State{isStateRequired? '*':''}</label>
                <SearchableSingleSelect
                  id="member-state"
                  isMandatory={isStateRequired}
                  placeholder="Select state or province"
                  displayKey="name"
                  options={states}
                  selectedOption={selectedState}
                  uniqueKey="name"
                  formKey="name"
                  name={"region"}
                  disabled={selectedCountry === null}
                  onClear={() => {}}
                  onChange={(item) => onStateSelectionChanged(item)}
                  arrowImgUrl="/icons/arrow-down.svg"
                />
                <HiddenField value={selectedState?.name || ''} defaultValue={selectedState?.name || ''} name={'region'} />
              </div>
              <div className="memberinfo__form__user__location__city">
                <label id="member-city" className='memberinfo__form__user__location__label'>Metro Area/City{isCityRequired? '*':''}</label>
                <SearchableSingleSelect
                  id="member-city"
                  isMandatory={isCityRequired}
                  placeholder="Select metro area or city"
                  displayKey="name"
                  options={cities}
                  selectedOption={selectedCity}
                  disabled={selectedState === null}
                  uniqueKey="name"
                  formKey="name"
                  name={"city"}
                  onClear={() => {}}
                  onChange={(item) => onCitySelectionChanged(item)}
                  arrowImgUrl="/icons/arrow-down.svg"
                />
                <HiddenField value={selectedCity?.name || ''} defaultValue={selectedCity?.name || ''} name={'city'} />
              </div>
            </div>
            <p className="info">
              <img src="/icons/info.svg" alt="name info" width="16" height="16px" />{' '}
              <span className="info__text">Please share location details to receive invitations for the network events happening in your area.</span>
            </p>
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
            margin-bottom: 75px;
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

          .memberinfo__form__user__location__country {
            width: 100%;
          }

          .memberinfo__form__user__location__state {
            width: 100%;
          }

          .memberinfo__form__user__location__city {
            width: 100%;
          }

          .memberinfo__form__user__location__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            display: block;
          }
        `}
      </style>
    </>
  );
}

export default MemberBasicInfo;
