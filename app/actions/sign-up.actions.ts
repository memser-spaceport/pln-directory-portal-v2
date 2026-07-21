'use server';

import { createMemberRequest } from '@/services/participants-request.service';

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
export async function signUpFormAction(data: any) {
  try {
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
      return { success: true, message: 'Form submitted successfully!', data: await formResult.json() };
    } else {
      const error = await formResult.json();
      return { success: false, message: error?.message || 'Form submission failed!' };
    }
    //   }
    // }
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error.message };
  }
}
