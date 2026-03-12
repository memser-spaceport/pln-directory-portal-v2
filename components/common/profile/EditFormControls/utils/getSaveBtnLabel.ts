type Input = {
  isDirty: boolean;
  isSubmitting: boolean;
}

export function getSaveBtnLabel(input: Input) {
  const { isDirty, isSubmitting } = input;

  if (!isDirty) {
    return 'No Changes';
  }

  return isSubmitting ? 'Processing... ' : 'Save'
}
