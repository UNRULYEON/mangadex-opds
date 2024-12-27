import { Manga, MD_List, ResponseEntity } from "@/types/index.ts";
import { mangas } from "@/repository/index.ts";

const byId = ({ id }: { id: string }): Promise<Manga[]> => {
  return new Promise((resolve, reject) => {
    fetch(`https://api.mangadex.org/list/${id}?includes[]=user`)
      .then(async (res) => {
        if (res.status !== 200) {
          reject("Error fetching manga");
        }

        const listJson: ResponseEntity<MD_List> = await res.json();

        const mangas1 = await mangas.get.all({
          limit: 100,
          ids: listJson.data.relationships
            .filter((relationship) => relationship.type === "manga")
            .map((relationship) => relationship.id),
        });

        resolve(mangas1);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const lists = {
  get: {
    byId,
  },
};
