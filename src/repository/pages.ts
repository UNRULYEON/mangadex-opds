import { MD_AtHomeChapter } from "@/types/index.ts";

const byId = ({
  chapterId,
  pageNumber,
}: {
  chapterId: string;
  pageNumber: number | string;
}): Promise<{
  filename: string;
  buffer: Uint8Array;
}> => {
  return new Promise((resolve, reject) => {
    if (isNaN(Number(pageNumber))) {
      reject("Invalid page number");
    }

    fetch(`https://api.mangadex.org/at-home/server/${chapterId}`).then(
      async (res) => {
        if (res.status !== 200) {
          reject("Error fetching chapter");
        }

        const data: MD_AtHomeChapter = await res.json();

        if (!data) {
          reject("Chapter not found");
        }

        const baseUrl = `${data.baseUrl}/data-saver/${data.chapter.hash}`;

        const url = `${baseUrl}/${data.chapter.dataSaver[Number(pageNumber)]}`;

        const response = await fetch(url);

        const buffer = new Uint8Array(
          await (await response.blob()).arrayBuffer(),
        );

        resolve({
          filename: url.split("/").pop() as string,
          buffer,
        });
      },
    );
  });
};

export const pages = {
  get: {
    byId,
  },
};
