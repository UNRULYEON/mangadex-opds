import { Manga } from "@/types/index.ts";

export type Chapter = {
  id: string;
  volume: string;
  chapter: string;
  title: string;
  updatedAt: string;
  pages: number;
  manga: Manga;
};
