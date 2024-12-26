export type MD_Cover = {
  id: string;
  type: "cover_art";
  attributes: {
    description: string;
    volume: string;
    fileName: string;
    locale: string;
    createdAt: string;
    updatedAt: string;
    version: string;
  };
  relationships: {
    id: string;
    type: "manga" | "user";
  }[];
};
