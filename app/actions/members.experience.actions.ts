'use server';

import { getHeader } from '@/utils/common.utils';
import { cookies } from 'next/headers';

export const MemberExperienceFormAction = async (state: any, formData: FormData) => {
  const authToken = cookies().get('authToken')?.value ?? '';

  const experienceId = formData.get('experience-uid');
  if (formData.get('actionType') === 'delete') {
    return await deleteMemberExperience(experienceId as string, authToken);
  } else {
    return await saveMemberExperience(experienceId as string, formData, authToken);
  }
};

const validate = (formattedData: any) => {
  const errs: any = {};
  const regex = /^[a-zA-Z0-9\s\-&,]{2,100}$/;
  const companyRegex = /^[a-zA-Z0-9\s\-&,\.]{2,100}$/;
  const locationRegex = /^[a-zA-Z0-9\s.,-]{2,100}$/;

  // Title validation
  if (!formattedData?.title?.trim()) errs.title = 'Please provide the title';
  if (formattedData?.title?.trim()?.length > 100) errs.title = 'Title must be less than 100 characters';
  if (formattedData?.title?.trim()?.length > 1 && !regex.test(formattedData?.title?.trim())) errs.title = 'Title contains invalid characters.';

  // Company validation
  if (!formattedData?.company?.trim()) errs.company = 'Please provide the company name';
  if (formattedData?.company?.trim()?.length > 100) errs.company = 'Company name must be less than 100 characters';
  if (formattedData?.company?.trim()?.length > 1 && !companyRegex.test(formattedData?.company?.trim())) errs.company = 'Company name contains invalid characters.';

  // Start date validation
  if (!formattedData?.startDate?.month) errs.startMonth = 'Please provide the start month';
  if (!formattedData?.startDate?.year) errs.startYear = 'Please provide the start year';

  // End date validation
  if (!formattedData?.isCurrent) {
    if (!formattedData?.endDate?.month) errs.endMonth = 'Please provide the end month';
    if (!formattedData?.endDate?.year) errs.endYear = 'Please provide the end year';
    if (formattedData?.endDate?.month && formattedData?.endDate?.year) {
      const endDate = new Date(formattedData?.endDate?.year, formattedData?.endDate?.month - 1, 1);
      const startDate = new Date(formattedData?.startDate?.year, formattedData?.startDate?.month - 1, 1);
      if (endDate < startDate) errs.endDate = 'End date must be greater than start date';
    }
  }

  // Location validation
  if (formattedData?.location?.trim()?.length > 100) errs.location = 'Location must be less than 100 characters';
  if (formattedData?.location?.trim()?.length > 0 && !locationRegex.test(formattedData?.location?.trim())) errs.location = 'Location contains invalid characters.';

  return errs;
};

const transformObject = (object: any) => {
  const formattedData = Object.fromEntries(object);
  const startDateMonth = formattedData?.['add-edit-experience-startDate']
  ? formattedData['add-edit-experience-startDate'].includes('-')
    ? formattedData['add-edit-experience-startDate'].split('-')[1]
    : 0
  : 0;
  const startDateYear = formattedData?.['add-edit-experience-startDate']
  ? formattedData['add-edit-experience-startDate'].includes('-')
    ? formattedData['add-edit-experience-startDate'].split('-')[0]
    : 0
  : 0;

  const endDateMonth = formattedData?.['add-edit-experience-endDate']
  ? formattedData['add-edit-experience-endDate'].includes('-')
    ? formattedData['add-edit-experience-endDate'].split('-')[1]
    : 0
  : 0;

  const endDateYear = formattedData?.['add-edit-experience-endDate']
  ? formattedData['add-edit-experience-endDate'].includes('-')
    ? formattedData['add-edit-experience-endDate'].split('-')[0]
    : 0
  : 0;
  

  const experienceData = {
    title: formattedData?.['experience-title'],
    company: formattedData?.['experience-company'],
    startDate: {
      month: startDateMonth,
      year: startDateYear,
      day: 0,
    },
    endDate: {
      month: endDateMonth,
      year: endDateYear,
      day: 0,
    },
    location: formattedData?.['experience-location'],
    isCurrent: formattedData?.['isCurrent'] === 'true',
    memberUid: formattedData?.['memberId'],
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
    return { success: false, message: 'Experience deletion failed!', errorCode: 'delete-experience-error' };
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
    return { success: false, message: 'Experience update failed!', errorCode: 'update-experience-error' };
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
    return { success: false, message: 'Experience addition failed!', errorCode: 'add-experience-error' };
  }
};
