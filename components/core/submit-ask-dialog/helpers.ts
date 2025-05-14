import * as yup from 'yup';

export const submitAskFormSchema = yup.object({
  title: yup.string().required('Title is required'),

  description: yup.string().required('Description is required'),

  tags: yup.array().of(yup.string().required().min(1, 'Tag cannot be empty')).min(1, 'At least one tag is required').required('Tags are required'),
});
