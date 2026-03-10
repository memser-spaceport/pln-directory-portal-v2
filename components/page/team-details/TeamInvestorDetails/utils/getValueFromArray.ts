import isEmpty from 'lodash/isEmpty';

export function getValueFromArray(values?: string[]) {
  return isEmpty(values) ? '-' : values?.join(', ');
}
