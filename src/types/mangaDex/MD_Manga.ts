export type MD_Manga = {
  id: string;
  type: "manga";
  attributes: {
    title: {
      en: string;
    };
    altTitles: Record<string, string>[];
    description: {
      en: string;
    };
    createdAt: string;
    updatedAt: string;
    availableTranslatedLanguages: string[];
  };
  relationships: {
    id: string;
    type: "author" | "artist" | "cover_art" | "creator";
  }[];
};
