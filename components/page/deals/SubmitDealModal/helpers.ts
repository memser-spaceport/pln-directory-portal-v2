import * as yup from 'yup';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export const submitDealSchema = yup.object().shape({
  vendorName: yup
    .string()
    .required('Vendor name is required')
    .max(100, 'Max 100 characters'),
  category: yup
    .string()
    .required('Category is required'),
  audience: yup
    .object()
    .shape({
      value: yup.string().required(),
      label: yup.string().required(),
    })
    .nullable()
    .required('Audience is required'),
  shortDescription: yup
    .string()
    .required('Short description is required')
    .max(100, 'Max 100 characters'),
  fullDescription: yup
    .string()
    .required('Full description is required')
    .test('not-empty-html', 'Full description is required', (value) => {
      return !!value && stripHtml(value).length > 0;
    })
    .test('max-length', 'Max 600 characters', (value) => {
      return !value || stripHtml(value).length <= 600;
    }),
  redemptionInstructions: yup
    .string()
    .required('Redemption instructions are required')
    .test('not-empty-html', 'Redemption instructions are required', (value) => {
      return !!value && stripHtml(value).length > 0;
    })
    .test('max-length', 'Max 600 characters', (value) => {
      return !value || stripHtml(value).length <= 600;
    }),
  websiteUrl: yup
    .string()
    .required('Website URL is required')
    .url('Must be a valid URL'),
  contact: yup
    .string()
    .required('Contact info is required')
    .max(200, 'Max 200 characters'),
});

export interface SubmitDealFormData {
  vendorName: string;
  category: string;
  audience: { value: string; label: string } | null;
  shortDescription: string;
  fullDescription: string;
  redemptionInstructions: string;
  websiteUrl: string;
  contact: string;
}
