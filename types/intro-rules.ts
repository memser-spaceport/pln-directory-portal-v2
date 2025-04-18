export interface Lead {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface Rule {
  id: string;
  topic: Topic;
  tags: Tag[];
  leads: Lead[];
}

export interface Topic {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface IntroRuleData {
  rules: Rule[];
  topics: Topic[];
  tags: Tag[];
  members: any[];
} 