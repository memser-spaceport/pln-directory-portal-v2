import * as yup from 'yup';

export const requestDealSchema = yup.object().shape({
  whatDealAreYouLookingFor: yup
    .string()
    .required('Please describe the deal you are looking for')
    .max(200, 'Max 200 characters'),
  description: yup.string().optional().max(600, 'Max 600 characters'),
});

export interface RequestDealFormData {
  whatDealAreYouLookingFor: string;
  description?: string;
}
