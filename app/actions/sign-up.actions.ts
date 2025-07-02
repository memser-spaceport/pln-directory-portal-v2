'use server';

import validateCaptcha from '@/services/google-recaptcha.service';
import { createMemberRequest, createParticipantRequest } from '@/services/participants-request.service';
import { saveRegistrationImage } from '@/services/registration.service';
import { checkEmailDuplicate, formatFormDataToApi, validateSignUpForm } from '@/services/sign-up.service';
import { cookies } from 'next/headers';
import { isSkipRecaptcha } from '@/utils/common.utils';

/**
 * Handles the sign-up form submission action.
 *
 * @param {any} data - The form data to be processed.
 * @returns {Promise<{ success: boolean, errors?: any, message?: string }>}
 * - A promise that resolves to an object indicating the success or failure of the form submission.
 *
 * The function performs the following steps:
 * 1. Converts the form data entries to an object.
 * 2. Formats the form data to match the API requirements.
 * 3. Validates the formatted form data.
 * 4. Checks for duplicate email addresses.
 * 5. Handles image upload if a member profile image is provided.
 * 6. Creates a registration request with the formatted data.
 * 7. Returns the result of the form submission.
 *
 * @throws {Error} If an error occurs during the form submission process.
 */
export async function signUpFormAction(data: any, recaptchaToken: string | undefined) {
  try {
    // const formData = Object.fromEntries(data.entries());
    // console.log(formData);

    // const campaign = cookies().get('utm_campaign')?.value ?? '';
    // const source = cookies().get('utm_source')?.value ?? '';
    // const medium = cookies().get('utm_medium')?.value ?? '';
    // const cookiesValue = {
    //   signUpMedium: medium,
    //   signUpCampaign: campaign,
    //   signUpSource: source,
    // };

    // let formattedObj;
    // formattedObj = formatFormDataToApi(formData,cookiesValue);
    if (!isSkipRecaptcha()) {
      if (recaptchaToken) {
        const isCaptchaVerified = await validateCaptcha(recaptchaToken);

        if (isCaptchaVerified && !isCaptchaVerified.success) {
          console.error(`Captcha verification failed while adding subscriber for user: ${data.email}`);
          return { success: false, message: 'Captcha verification failed.' };
        }
      } else {
        return { success: false, message: 'Captcha token not found.' };
      }
    }

    // let errors: any = validateSignUpForm(formattedObj);

    // if (Object.entries(errors).length) {
    //   // Returns the validation errors if any
    //   return { success: false, errors: errors };
    // } else {
    //   const isEmailValid = await checkEmailDuplicate(formattedObj.email);

    //   if (Object.entries(isEmailValid).length) {

    //     // Returns the email validation errors if any
    //     return { success: false, errors: isEmailValid };

    //   } else {
    //     if (formattedObj.memberProfile && formattedObj.memberProfile.size > 0) {
    //       try {

    //         // Uploads the member profile image into s3 and attaches the imageUid and imageUrl
    //         const imgResponse = await saveRegistrationImage(formattedObj.memberProfile);
    //         const image = imgResponse?.image;
    //         formattedObj.imageUid = image.uid;
    //         formattedObj.imageUrl = image.url;
    //         delete formattedObj.memberProfile;
    //       } catch (er) {
    //         // Returns an error message if the image upload fails
    //         return { success: false, message: 'Image upload failed.Please retry again later!' };
    //       }
    //     }
    //     formattedObj.memberProfile && delete formattedObj.memberProfile;
    //     formattedObj.imageFile && delete formattedObj.imageFile;

    // Create registration request
    const bodyData = {
      participantType: 'MEMBER',
      status: 'PENDING',
      requesterEmailId: data.email,
      uniqueIdentifier: data.email,
      newData: { ...data, openToWork: false },
    };

    const formResult = await createMemberRequest(bodyData);

    // Returns the form submission result
    if (formResult.ok) {
      console.log(formResult);

      return { success: true, message: 'Form submitted successfully!', data: await formResult.json() };
    } else {
      return { success: false, message: 'Form submission failed!' };
    }
    //   }
    // }
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error.message };
  }
}
