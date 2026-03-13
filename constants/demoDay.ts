export const DEMO_DAY_UPFRONT_INDUSTRY_TAGS = [
  'AI',
  'Blockchain Infrastructure',
  'Compute',
  'Developer Tooling',
] as const;

export const INVITE_FORM_URL =
  'https://docs.google.com/forms/d/1c_djy7MnO-0k89w1zdFnBKF6GLdYKKWUvLTDBjxd114/viewform?edit_requested=true';

export const FOUNDERS_FORGE_URL = 'https://www.founders-forge.xyz/';
export const APPLY_FOR_NEXT_DEMO_DAY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeg_3wBTLcDtsPrcGti3KqWTiGMQzwI5Mmkw42ckqQ7R2-INg/viewform';

export type DemoDayMaterials = {
  pitchDeckUrl: string;
  pitchVideoUrl: string;
  pitchVideoPoster: string;
  materialDocPrep: string;
};

const DEMO_DAY_MATERIALS: Record<string, DemoDayMaterials> = {
  plf25: {
    pitchDeckUrl: 'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/demo_day_preview.png',
    pitchVideoUrl: 'https://plabs-assets.s3.us-west-1.amazonaws.com/pl-f25-demoday-video.mp4',
    pitchVideoPoster: 'https://plabs-assets.s3.us-west-1.amazonaws.com/Video_Preview_PL_DD_25.png',
    materialDocPrep: 'https://docs.google.com/document/d/1Rtrbs6684K5XMAlAUiqdt2XESrkAiSTzEYhl5j8coOI/edit?tab=t.0#heading=h.th9rcgmw87qq',
  },
  plw26: {
    pitchDeckUrl: 'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/demo_day_preview.png',
    pitchVideoUrl: '',
    pitchVideoPoster: '',
    materialDocPrep: 'https://docs.google.com/document/d/1sed2j7HMPfY5X7RVmwQkEKMQOJvzArYyyFffC_Kn4WA/edit',
  },
  default: {
    pitchDeckUrl: 'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/demo_day_preview.png',
    pitchVideoUrl: '',
    pitchVideoPoster: '',
    materialDocPrep: 'https://docs.google.com/document/d/1Rtrbs6684K5XMAlAUiqdt2XESrkAiSTzEYhl5j8coOI/edit?tab=t.0#heading=h.th9rcgmw87qq',
  },
};

export const getDemoDayMaterials = (slug: string): DemoDayMaterials | undefined => DEMO_DAY_MATERIALS[slug] || DEMO_DAY_MATERIALS.default;
