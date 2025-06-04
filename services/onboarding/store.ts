import { create } from 'zustand';

// import { createStoreWithSelectors } from '@/utils/zustand/store.utils';

export type OnboardingWizardStep = 'welcome' | 'profile' | 'contacts' | 'expertise';

export interface OnboardingStore {
  readonly step: OnboardingWizardStep;
  actions: {
    setStep: (nextStep: OnboardingWizardStep) => void;
  };
}

export const useOnboardingState = create<OnboardingStore>((setState) => ({
  step: 'profile',
  actions: {
    setStep: (nextStep) => setState({ step: nextStep }),
  },
}));

// export const useOnboardingState = createStoreWithSelectors(onboardingStore);
