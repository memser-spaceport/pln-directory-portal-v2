import * as yup from 'yup';

export type RequestGuideForm = {
  title: string;
  description: string;
};

export const requestGuideSchema = yup.object().shape({
  title: yup.string().trim().required('Topic is required').max(100, 'Max 100 characters'),
  description: yup.string().optional().max(600, 'Max 600 characters'),
});

export const defaultValues: RequestGuideForm = {
  title: '',
  description: '',
};
