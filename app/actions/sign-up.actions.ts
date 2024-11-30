'use server';

import { createParticipantRequest } from '@/services/participants-request.service';
import { saveRegistrationImage } from '@/services/registration.service';
import { checkEmailDuplicate, formatFormDataToApi, validateSignUpForm } from '@/services/sign-up.service';

export async function signUpFormAction(data: any) {
  try {
    const formData = Object.fromEntries(data.entries());

    const formattedObj = formatFormDataToApi(formData);
    let errors = validateSignUpForm(formattedObj);

    if (Object.entries(errors).length) {
      return { success: false, errors: errors };
    } else {
      const isEmailValid = await checkEmailDuplicate(formattedObj.email);
      if (Object.entries(isEmailValid).length) {
        return { success: false, errors: isEmailValid };
      } else {
        if (formattedObj.memberProfile && formattedObj.memberProfile.size > 0) {
          try {
            const imgResponse = await saveRegistrationImage(formattedObj.memberProfile);
            const image = imgResponse?.image;
            formattedObj.imageUid = image.uid;
            formattedObj.imageUrl = image.url;
            delete formattedObj.memberProfile;
          } catch (er) {
            return { success: false, message: 'Image upload failed!' };
          }
        }
        formattedObj.memberProfile && delete formattedObj.memberProfile;
        formattedObj.imageFile && delete formattedObj.imageFile;

        console.log(formattedObj);
        

        // Create registration request
        const bodyData = {
          participantType: 'MEMBER',
          status: 'PENDING',
          requesterEmailId: formattedObj.email,
          uniqueIdentifier: formattedObj.email,
          newData: { ...formattedObj, openToWork: false },
        };

        const formResult = await createParticipantRequest(bodyData);

        if (formResult.ok) {
          return { success: true, message: 'Form submitted successfully!' };
        } else {
          return { success: false, message: 'Form submission failed!' };
        }
      }
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
