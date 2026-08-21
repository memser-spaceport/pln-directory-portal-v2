import * as yup from 'yup';

import { SocialField, validateSocialField } from '@/utils/profile/validateSocialField';

export function socialFieldSchema(field: SocialField) {
  return yup
    .string()
    .nullable()
    .defined()
    .test({
      name: 'social-field-shape',
      test(value) {
        const message = validateSocialField(field, value);

        return message ? this.createError({ message }) : true;
      },
    });
}
