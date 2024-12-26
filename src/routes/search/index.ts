import { Hono } from "hono";
import { stringify } from "@libs/xml/stringify";

export const search = new Hono();

search.get("/", (c) => {
  c.header("Content-Type", "application/xml");

  return c.body(
    stringify({
      OpenSearchDescription: {
        "@xmlns": "http://a9.com/-/spec/opensearch/1.1/",
        ShortName: "Search",
        Description: "Search for mangas",
        InputEncoding: "UTF-8",
        OutputEncoding: "UTF-8",
        Url: {
          "@template": "/v1.2/manga?search={searchTerms}",
          "@type": "application/atom+xml;profile=opds-catalog;kind=acquisition",
        },
      },
    }),
  );
});
