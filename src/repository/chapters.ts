import * as zip from "@quentinadam/zip";
import {
  Chapter,
  MD_AtHomeChapter,
  MD_Chapter,
  ResponseCollection,
} from "@/types/index.ts";
import { mangas } from "@/repository/index.ts";

const all = ({
  id,
  lang,
}: {
  id: string;
  lang: string;
}): Promise<Chapter[]> => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=${lang}`,
    )
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching chapters");
        }

        const chaptersJson: ResponseCollection<MD_Chapter[]> = await res.json();

        const chapters: Chapter[] = await Promise.all(
          chaptersJson.data
            .filter((chapter) => !chapter.attributes.externalUrl)
            .map(async (chapter) => {
              const result = await mangas.get.byId({ id });

              return {
                id: chapter.id,
                volume: chapter.attributes.volume,
                chapter: chapter.attributes.chapter,
                title: chapter.attributes.title,
                updatedAt: chapter.attributes.updatedAt,
                pages: chapter.attributes.pages,
                manga: {
                  id: result.id,
                  title: result.title,
                  updatedAt: result.updatedAt,
                  coverUrl: result.coverUrl,
                  availableTranslatedLanguages:
                    result.availableTranslatedLanguages,
                },
              };
            }),
        );

        chapters.sort((a, b) => {
          return parseFloat(a.chapter) - parseFloat(b.chapter);
        });

        resolve(chapters);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const byId = ({ chapterId }: { chapterId: string }): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    fetch(`https://api.mangadex.org/at-home/server/${chapterId}`)
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching chapter");
        }

        const data: MD_AtHomeChapter = await res.json();

        if (!data) {
          reject("Chapter not found");
        }

        const baseUrl = `${data.baseUrl}/data-saver/${data.chapter.hash}`;

        const urls = data.chapter.dataSaver.map((url) => `${baseUrl}/${url}`);

        const files: {
          name: string;
          data: Uint8Array;
          lastModification?: Date;
        }[] = await Promise.all(
          urls.map(async (url: string) => {
            const response = await fetch(url);

            return {
              name: url,
              data: new Uint8Array(await (await response.blob()).arrayBuffer()),
            };
          }),
        );

        const buffer = await zip.create(files);

        resolve(buffer);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const chapters = {
  get: {
    all,
    byId,
  },
};
