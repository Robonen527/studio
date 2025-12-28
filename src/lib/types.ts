export type Parsha = {
  slug: string;
  name: string;
};

export type Insight = {
  id: string;
  parshaSlug: string;
  title: string;
  content: string;
  author: string;
  createdAt: string; // ISO string
};
