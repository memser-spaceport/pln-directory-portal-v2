'use server'

import { revalidatePath } from 'next/cache';

const revalidate = async () => {
  try {
    // Revalidate the IRL events pages
    revalidatePath('/events/irl');
    return { success: true };
  } catch (error) {
    console.error('Error during cache revalidation:', error);
    return { success: false, error: error };
  }
}

export default revalidate;