import { Context, Hono } from "hono";
import { chapters, mangas, pages } from "@/repository/index.ts";
import { stringify } from "@libs/xml/stringify";

export const manga = new Hono();

manga.get("/", async (c) => {
  const { search } = c.req.query();

  const data = await mangas.get.all({
    title: search,
    hasAvailableChapters: true,
  });

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id: "root",
        title: "MangaDex OPDS Feed",
        updated: new Date().toISOString(),
        author: {
          name: "MangaDex OPDS",
          uri: "https://github.com/UNRULYEON/mangadex-opds",
        },
        link: [
          {
            "@type":
              "application/atom+xml;profile=opds-catalog;kind=navigation",
            "@rel": "self",
            "@href": "/v1.2/manga",
          },
        ],
        entry: data.map((manga) => ({
          title: manga.title,
          id: manga.id,
          updated: manga.updatedAt,
          link: [
            {
              "@type": "image/jpg",
              "@rel": "http://opds-spec.org/image/thumbnail",
              "@href": manga.coverUrl,
            },
            {
              "@type": "image/jpg",
              "@rel": "http://opds-spec.org/image",
              "@href": manga.coverUrl,
            },
            {
              "@type":
                "application/atom+xml;profile=opds-catalog;kind=navigation",
              "@rel": "subsection",
              "@href": `/v1.2/manga/${manga.id}`,
            },
          ],
        })),
      },
    }),
  );
});

manga.get("/:id", async (c) => {
  const { id } = c.req.param();

  const result = await mangas.get.byId({ id });

  if (!result) {
    return c.text("Not found", 404);
  }

  c.header("Content-Type", "application/xml");

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id,
        title: result.title,
        updated: result.updatedAt,
        author: {
          name: "MangaDex OPDS",
          uri: "https://github.com/UNRULYEON/mangadex-opds",
        },
        entry: result
          .availableTranslatedLanguages
          .sort((a, b) => a.localeCompare(b))
          .map((lang: string) => ({
            title: `[${lang.toUpperCase()}] - ${result.title}`,
            id: lang,
            link: [
              {
                "@type": "image/jpg",
                "@rel": "http://opds-spec.org/image/thumbnail",
                "@href": result.coverUrl,
              },
              {
                "@type": "image/jpg",
                "@rel": "http://opds-spec.org/image",
                "@href": result.coverUrl,
              },
              {
                "@type":
                  "application/atom+xml;profile=opds-catalog;kind=navigation",
                "@rel": "subsection",
                "@href": `/v1.2/manga/${id}/language/${lang}`,
              },
            ],
          })),
      },
    }),
  );
});

manga.get("/:id/language/:lang", async (c: Context) => {
  const { id, lang } = c.req.param();

  const result = await chapters.get.all({
    id,
    lang,
  });

  if (result.length === 0) {
    return c.text("Not found", 404);
  }

  c.header("Content-Type", "application/xml");

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id,
        title: result[0].manga.title,
        updated: new Date().toISOString(),
        author: {
          name: "MangaDex OPDS",
          uri: "https://github.com/UNRULYEON/mangadex-opds",
        },
        entry: result.map((chapter) => ({
          title: `${chapter.manga.title} - Chapter ${chapter.chapter}`,
          id: chapter.id,
          updated: chapter.updatedAt,
          link: [
            {
              "@type": "image/jpg",
              "@rel": "http://opds-spec.org/image/thumbnail",
              "@href": chapter.manga.coverUrl,
            },
            {
              "@type": "image/jpg",
              "@rel": "http://opds-spec.org/image",
              "@href": chapter.manga.coverUrl,
            },
            {
              "@type": "application/zip",
              "@rel": "http://opds-spec.org/acquisition",
              "@href":
                `/v1.2/manga/${id}/language/${lang}/chapter/${chapter.id}`,
            },
            {
              "@xmlns:wstxns11": "http://vaemendis.net/opds-pse/ns",
              "@href":
                `/v1.2/manga/${id}/language/${lang}/chapter/${chapter.id}?page={pageNumber}`,
              "@wstxns11:count": chapter.pages,
              "@type": "image/jpg",
              "@rel": "http://vaemendis.net/opds-pse/stream",
            },
          ],
        })),
      },
    }),
  );
});

manga.get("/:id/language/:lang/chapter/:chapterId", async (c: Context) => {
  const { id, chapterId } = c.req.param();
  const { page } = c.req.query();

  if (page) {
    const result = await pages.get.byId({
      chapterId,
      pageNumber: page,
    });

    c.header("Content-Type", "image/jpeg");
    c.header("Content-Disposition", `inline; filename=${result.filename}`);

    return c.body(result.buffer);
  }

  const result = await chapters.get.byId({
    chapterId,
  });

  c.header("Content-Type", "x-rar-compressed");
  c.header("Content-Disposition", `attachment; filename=${id}.cbz`);

  return c.body(result);
});
