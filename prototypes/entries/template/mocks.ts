export type TemplateItem = {
  id: string;
  name: string;
  status: 'active' | 'pending';
};

export const mockTemplateItems: TemplateItem[] = [
  { id: '1', name: 'First mocked item', status: 'active' },
  { id: '2', name: 'Second mocked item', status: 'pending' },
  { id: '3', name: 'Third mocked item', status: 'active' },
];

export const mockTemplatePage = {
  title: 'Prototype template',
  description: 'Copy this folder when starting a new prototype. Replace mock data and UI with your feature preview.',
};
