export type FoundItem = {
  uid: string;
  name: string;
  index: 'teams' | 'members' | 'events' | 'projects';
  matches: {
    field: string;
    content: string;
  }[];
};

export type SearchResult = {
  events?: FoundItem[];
  members?: FoundItem[];
  teams?: FoundItem[];
  projects?: FoundItem[];
  top?: FoundItem[];
};
