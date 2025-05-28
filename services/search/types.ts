export type FoundItem = {
  uid: string;
  name: string;
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
};
