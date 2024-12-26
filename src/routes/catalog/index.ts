import { Hono } from "hono";
import { stringify } from "@libs/xml/stringify";

export const catalog = new Hono();

catalog.get("/", (c) => {
  c.header("Content-Type", "application/xml");

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
            "@href": "/v1.2/catalog",
          },
          {
            "@type":
              "application/atom+xml;profile=opds-catalog;kind=navigation",
            "@rel": "start",
            "@href": "/v1.2/catalog",
          },
          {
            "@type": "application/opensearchdescription+xml",
            "@rel": "search",
            "@href": "/v1.2/search",
          },
          {
            "@type": "application/opds+json",
            "@rel": "alternate",
            "@href": "/v1.2/catalog",
          },
        ],
        entry: [
          {
            title: "Latest updates",
            id: "latestUpdates",
            content: "Manga that have been recently updated",
            link: {
              "@type":
                "application/atom+xml;profile=opds-catalog;kind=navigation",
              "@rel": "subsection",
              "@href": "/v1.2/latest-updates",
            },
          },
          {
            title: "Recently added",
            id: "keepReading",
            content: "Manga recently added to the catalog",
            link: {
              "@type":
                "application/atom+xml;profile=opds-catalog;kind=navigation",
              "@rel": "subsection",
              "@href": "/v1.2/recently-added",
            },
          },
        ],
      },
    }),
  );
});
