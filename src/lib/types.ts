export type Parsha = {
  id: string; // slug is the id
  name: string;
  chumashId: string;
};

export type Chumash = {
  id: string;
  name: string;
  order: number;
};

export type Insight = {
  id: string;
  parshaSlug: string;
  title: string;
  content: string;
  author: string;
  createdAt: string; // ISO string
};
