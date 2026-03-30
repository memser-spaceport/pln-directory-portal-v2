import * as yup from 'yup';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const requestDealSchema = yup.object().shape({
  whatDealAreYouLookingFor: yup
    .string()
    .required('Please describe the deal you are looking for')
    .max(200, 'Max 200 characters'),
  description: yup
    .string()
    .required('Please describe why this would be useful')
    .test('not-empty-html', 'Please describe why this would be useful', (value) => {
      return !!value && stripHtml(value).length > 0;
    })
    .test('max-length', 'Max 600 characters', (value) => {
      return !value || stripHtml(value).length <= 600;
    }),
  howToReachOutToYou: yup.string().required('Contact info is required').max(200, 'Max 200 characters'),
});

export interface RequestDealFormData {
  whatDealAreYouLookingFor: string;
  description: string;
  howToReachOutToYou: string;
}
