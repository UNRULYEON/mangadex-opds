import { Hono } from "hono";
import { mangas } from "@/repository/index.ts";
import { stringify } from "@libs/xml/stringify";

export const latestUpdates = new Hono();

latestUpdates.get("/", async (c) => {
  const page = c.req.query("page");
  const LIMIT = 10;
  const OFFSET = page ? parseInt(page) * LIMIT : 0;

  const data = await mangas.get.all({
    limit: LIMIT,
    offset: OFFSET,
    includes: {
      user: true,
      scanlationGroup: true,
      manga: true,
    },
    contentRating: {
      safe: true,
      suggestive: true,
      erotica: true,
    },
    order: {
      reabableAt: "desc",
    },
  });

  c.header("Content-Type", "application/xml");

  const links = [
    {
      "@type": "application/atom+xml;profile=opds-catalog;kind=navigation",
      "@rel": "self",
      "@href": "/v1.2/recently-added",
    },
    {
      "@type": "application/atom+xml;profile=opds-catalog;kind=navigation",
      "@rel": "start",
      "@href": "/v1.2/catalog",
    },
    page && {
      "@type": "application/atom+xml;profile=opds-catalog;kind=navigation",
      "@rel": "previous",
      "@href": `/v1.2/recently-added?page=${parseInt(page) - 1}`,
    },
    // page !== '10' && {
    {
      "@type": "application/atom+xml;profile=opds-catalog;kind=navigation",
      "@rel": "next",
      "@href": `/v1.2/recently-added?page=${parseInt(page ?? "0") + 1}`,
    },
  ].filter(Boolean);

  if (!data) {
    return c.body(
      stringify({
        feed: {
          "@xmlns": "http://www.w3.org/2005/Atom",
          id: "recently-added",
          title: "Recently added",
          updated: new Date().toISOString(),
          author: {
            name: "MangaDex OPDS",
            uri: "https://github.com/UNRULYEON/mangadex-opds",
          },
          link: [...links],
        },
      }),
    );
  }

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id: "recently-added",
        title: "Recently added",
        updated: new Date().toISOString(),
        author: {
          name: "MangaDex OPDS",
          uri: "https://github.com/UNRULYEON/mangadex-opds",
        },
        link: [...links],
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
