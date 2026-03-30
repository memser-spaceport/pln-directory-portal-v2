type Input = {
  isDirty: boolean;
  isProcessing: boolean;
};

export function getSaveBtnLabel(input: Input) {
  const { isDirty, isProcessing } = input;

  if (!isDirty) {
    return 'No Changes';
  }

  return isProcessing ? 'Processing... ' : 'Save';
}
