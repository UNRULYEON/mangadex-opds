import {
  Manga,
  MD_Cover,
  MD_Manga,
  ResponseCollection,
  ResponseEntity,
} from "@/types/index.ts";

export const all = ({
  limit = 10,
  offset = 0,
  title,
  includes,
  contentRating,
  order,
  hasAvailableChapters,
}: {
  limit?: number;
  offset?: number;
  title?: string;
  includes?: {
    user?: boolean;
    scanlationGroup?: boolean;
    manga?: boolean;
  };
  contentRating?: {
    safe?: boolean;
    suggestive?: boolean;
    erotica?: boolean;
  };
  order?: {
    reabableAt?: "asc" | "desc";
    createdAt?: "asc" | "desc";
    updatedAt?: "asc" | "desc";
  };
  hasAvailableChapters?: boolean;
}): Promise<Manga[]> => {
  return new Promise((resolve, reject) => {
    const url = new URL("https://api.mangadex.org/manga");

    url.searchParams.append("limit", limit.toString());
    if (offset) {
      url.searchParams.append("offset", offset.toString());
    }
    if (title) {
      url.searchParams.append("title", title);
    }
    if (includes) {
      if (includes.user) {
        url.searchParams.append("includes[]", "user");
      }
      if (includes.scanlationGroup) {
        url.searchParams.append("includes[]", "scanlation_group");
      }
      if (includes.manga) {
        url.searchParams.append("includes[]", "manga");
      }
    }
    if (contentRating) {
      if (contentRating.safe) {
        url.searchParams.append("contentRating[]", "safe");
      }
      if (contentRating.suggestive) {
        url.searchParams.append("contentRating[]", "suggestive");
      }
      if (contentRating.erotica) {
        url.searchParams.append("contentRating[]", "erotica");
      }
    }
    if (order) {
      if (order.createdAt) {
        url.searchParams.append("order[createdAt]", order.createdAt);
      }
      if (order.updatedAt) {
        url.searchParams.append("order[updatedAt]", order.updatedAt);
      }
    }
    if (typeof hasAvailableChapters === "boolean") {
      url.searchParams.append(
        "hasAvailableChapters",
        `${hasAvailableChapters}`,
      );
    }

    fetch(url.toString())
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching mangas");
        }

        const mangaJson: ResponseCollection<MD_Manga[]> = await res.json();

        const mangas: Manga[] = await Promise.all(
          mangaJson.data.map(async (manga) => {
            let coverUrl: string | undefined;

            const coverRelationship = manga.relationships.find(
              (relationship) => relationship.type === "cover_art",
            );

            if (coverRelationship) {
              const cover = await fetch(
                `https://api.mangadex.org/cover/${coverRelationship.id}`,
              );

              if (cover.status !== 200) {
                throw new Error("Error fetching cover");
              }

              const coverJson: ResponseEntity<MD_Cover> = await cover.json();

              coverUrl =
                `https://mangadex.org/covers/${manga.id}/${coverJson.data.attributes.fileName}`;
            }

            return {
              id: manga.id,
              title: manga.attributes.title.en,
              updatedAt: manga.attributes.updatedAt,
              coverUrl,
              availableTranslatedLanguages:
                manga.attributes.availableTranslatedLanguages,
            } as Manga;
          }),
        );

        resolve(mangas);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const recentlyAdded = ({
  limit = 5,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
}): Promise<Manga[]> => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mangadex.org/manga?limit=${limit}&offset=${offset}&order[createdAt]=desc&hasAvailableChapters=true`,
    )
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching mangas");
        }

        const mangaJson: ResponseCollection<MD_Manga[]> = await res.json();

        const mangas: Manga[] = await Promise.all(
          mangaJson.data.map(async (manga) => {
            let coverUrl: string | undefined;

            const coverRelationship = manga.relationships.find(
              (relationship) => relationship.type === "cover_art",
            );

            if (coverRelationship) {
              const cover = await fetch(
                `https://api.mangadex.org/cover/${coverRelationship.id}`,
              );

              if (cover.status !== 200) {
                throw new Error("Error fetching cover");
              }

              const coverJson: ResponseEntity<MD_Cover> = await cover.json();

              coverUrl =
                `https://mangadex.org/covers/${manga.id}/${coverJson.data.attributes.fileName}`;
            }

            return {
              id: manga.id,
              title: manga.attributes.title.en,
              updatedAt: manga.attributes.updatedAt,
              coverUrl,
              availableTranslatedLanguages:
                manga.attributes.availableTranslatedLanguages,
            } as Manga;
          }),
        );

        resolve(mangas);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const byId = ({ id }: { id: string }): Promise<Manga> => {
  return new Promise((resolve, reject) => {
    fetch(`https://api.mangadex.org/manga/${id}`)
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching manga");
        }

        const mangaJson: ResponseEntity<MD_Manga> = await res.json();

        let coverUrl: string | undefined;

        const coverRelationship = mangaJson.data.relationships.find(
          (relationship) => relationship.type === "cover_art",
        );

        if (coverRelationship) {
          const cover = await fetch(
            `https://api.mangadex.org/cover/${coverRelationship.id}`,
          );

          if (cover.status !== 200) {
            throw new Error("Error fetching cover");
          }

          const coverJson: ResponseEntity<MD_Cover> = await cover.json();

          coverUrl =
            `https://mangadex.org/covers/${mangaJson.data.id}/${coverJson.data.attributes.fileName}`;
        }

        resolve({
          id: mangaJson.data.id,
          title: mangaJson.data.attributes.title.en,
          updatedAt: mangaJson.data.attributes.updatedAt,
          coverUrl,
          availableTranslatedLanguages:
            mangaJson.data.attributes.availableTranslatedLanguages,
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const mangas = {
  get: {
    all,
    recentlyAdded,
    byId,
  },
};
