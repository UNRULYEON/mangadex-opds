export type MD_Chapter = {
  id: string;
  type: "chapter";
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    externalUrl: string | null;
    updatedAt: string;
    pages: number;
  };
};
