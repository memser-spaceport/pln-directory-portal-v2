'use server';

import { getHeader } from '@/utils/common.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export const MemberExperienceFormAction = async (state: any, formData: FormData) => {
  const { authToken } = getCookiesFromHeaders();

  const experienceId = formData.get('experience-uid');
  if (formData.get('actionType') === 'delete') {
    return await deleteMemberExperience(experienceId as string, authToken);
  } else {
    return await saveMemberExperience(experienceId as string, formData, authToken);
  }
};

const validate = (formattedData: any) => {
  const errs: any = {};
  const locationRegex = /^[a-zA-Z0-9\s.,-]{2,100}$/;

  // Title validation
  if (!formattedData?.title?.trim()) errs.title = 'Please provide the title';
  if (formattedData?.title?.trim()?.length > 100) errs.title = 'Title must be less than 100 characters';

  // Company validation
  if (!formattedData?.company?.trim()) errs.company = 'Please provide the company name';
  if (formattedData?.company?.trim()?.length > 100) errs.company = 'Company name must be less than 100 characters';

  // Start date validation
  if (!formattedData?.startDate) errs.startDate = 'Please provide the start date';
  const startDate = new Date(formattedData?.startDate);
  if(startDate > new Date()) errs.startDate = 'Start date must be in the past';


  if (!formattedData?.isCurrent && !formattedData?.endDate) errs.endDate = 'Please provide the end date';
  
  if(!formattedData.isCurrent) {
    const endDate = new Date(formattedData?.endDate);
    if (endDate < startDate) errs.endDate = 'End date must be greater than start date';
  } else {
    formattedData.endDate = null;
  }

  // Location validation
  if (formattedData?.location?.trim()?.length > 100) errs.location = 'Location must be less than 100 characters';
  if (formattedData?.location?.trim()?.length > 0 && !locationRegex.test(formattedData?.location?.trim())) errs.location = 'Location contains invalid characters.';

  return errs;
};

const transformObject = (object: any) => {
  const formattedData = Object.fromEntries(object);
  
  const experienceData = {
    title: formattedData?.['experience-title'],
    company: formattedData?.['experience-company'],
    startDate: formattedData?.['add-edit-experience-startDate'],
    endDate: formattedData?.['add-edit-experience-endDate'],
    location: formattedData?.['experience-location'],
    isCurrent: formattedData?.['isCurrent'] === 'true',
    memberUid: formattedData?.['memberId'],
    description: formattedData?.['description'],
  };
  return experienceData;
};

const saveMemberExperience = async (experienceId: string, formData: FormData, authToken: string) => {
  const formattedData: any = transformObject(formData);
  formattedData['isModifiedByUser'] = true;
  const errors = validate(formattedData);

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Form submission failed!', errors, errorCode: 'validation' };
  }

  if (experienceId) {
    return await updateMemberExperience(experienceId, formattedData, authToken);
  } else {
    return await addMemberExperience(formattedData, authToken);
  }
};

const deleteMemberExperience = async (experienceId: string, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member-experiences/${experienceId}`, {
    method: 'DELETE',
    headers: getHeader(authToken ?? ''),
  });
  if (response.ok) {
    return { success: true, message: 'Experience deleted successfully!', errorCode: 'success' };
  } else {
    if (response.status === 404) {
      return { success: false, message: 'Experience not found!', errorCode: 'experience-not-found', errors: {} };
    } else {
      return { success: false, message: 'Experience deletion failed!', errorCode: 'delete-experience-error', errors: {} };
    }
  }
};

const updateMemberExperience = async (experienceId: string, formattedData: any, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member-experiences/${experienceId}`, {
    method: 'PUT',
    body: JSON.stringify(formattedData),
    headers: getHeader(authToken ?? ''),
  });
  if (response.ok) {
    return { success: true, message: 'Experience updated successfully!', errorCode: 'success' };
  } else {
    if (response.status === 404) {
      return { success: false, message: 'Experience not found!', errorCode: 'experience-not-found', errors: {} };
    } else {
      return { success: false, message: 'Experience update failed!', errorCode: 'update-experience-error', errors: {} };
    }
  }
};

const addMemberExperience = async (data: any, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/member-experiences`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getHeader(authToken ?? ''),
  });

  if (response.ok) {
    return { success: true, message: 'Experience added successfully!', errorCode: 'success' };
  } else {
    return { success: false, message: 'Experience addition failed!', errorCode: 'add-experience-error', errors: {} };
  }
};
