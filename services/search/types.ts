export type FoundItem = {
  id: string;
  name: string;
  matches: {
    type: string;
    content: string;
  }[];
};

export type SearchResult = {
  events?: FoundItem[];
  members?: FoundItem[];
  teams?: FoundItem[];
  projects?: FoundItem[];
};
