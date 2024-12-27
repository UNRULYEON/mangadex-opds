import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { stringify } from "@libs/xml/stringify";
import { lists } from "@/repository/index.ts";

enum SEASON {
  WINTER = "winter",
  FALL = "fall",
  SUMMER = "summer",
  SPRING = "spring",
}

type Seasonal = {
  [year: string]: {
    [key in SEASON]?: string;
  };
};

// Sort so the most recent year and season is at the top
const SEASONAL: Seasonal = {
  "2024": {
    [SEASON.FALL]: "a5ba5473-07b2-4d0a-aefd-90d9d4a04521",
  },
};

export const seasonal = new Hono();

seasonal.get("/", (c) => {
  const flattenedSeasons = Object.keys(SEASONAL)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map((year) =>
      Object.keys(SEASONAL[year]).map((season) => ({
        year,
        season,
        id: SEASONAL[year][season as SEASON] as string,
      }))
    )
    .flat();

  c.header("Content-Type", "application/xml");

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id: "seasonal",
        title: "Seasonal",
        updated: new Date().toISOString(),
        author: {
          name: "MangaDex OPDS",
          uri: "https://github.com/UNRULYEON/mangadex-opds",
        },
        links: [
          {
            "@type":
              "application/atom+xml;profile=opds-catalog;kind=navigation",
            "@rel": "self",
            "@href": "/v1.2/seasonal",
          },
          {
            "@type":
              "application/atom+xml;profile=opds-catalog;kind=navigation",
            "@rel": "start",
            "@href": "/v1.2/catalog",
          },
        ],
        entry: flattenedSeasons.map(({ year, season, id }) => ({
          title: `${year} - ${
            season.charAt(0).toUpperCase() + season.slice(1)
          }`,
          id,
          updated: new Date().toISOString(),
          link: {
            "@type":
              "application/atom+xml;profile=opds-catalog;kind=navigation",
            "@rel": "subsection",
            "@href": `/v1.2/seasonal/${year}/${season}`.toLowerCase(),
          },
        })),
      },
    }),
  );
});

seasonal.get("/:year/:season", async (c) => {
  const { year, season } = c.req.param();

  const yearNumber = Number(year);
  if (isNaN(yearNumber)) {
    throw new HTTPException(400, { message: `"${year}" is not a valid year` });
  }

  if (!SEASON[season.toUpperCase() as keyof typeof SEASON]) {
    throw new HTTPException(400, {
      message: `"${season}" is not a valid season`,
    });
  }

  const id = SEASONAL[year][season as SEASON];

  if (!id) {
    throw new HTTPException(404, {
      message: `Seasonal manga for ${year} - ${season} is not available`,
    });
  }

  const mangas = await lists.get.byId({ id });

  c.header("Content-Type", "application/xml");

  return c.body(
    stringify({
      feed: {
        "@xmlns": "http://www.w3.org/2005/Atom",
        id: `seasonal-${year}-${season.charAt(0).toUpperCase() + season.slice(1)}`,
        title: `${year} - ${season}`,
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
            "@href": `/v1.2/seasonal/${year}/${season}`,
          },
        ],
        entry: mangas.map((manga) => ({
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
