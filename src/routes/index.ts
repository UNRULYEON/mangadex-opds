import { health } from "@/routes/health/index.ts";
import { catalog } from "@/routes/catalog/index.ts";
import { latestUpdates } from "@/routes/latest-updates/index.ts";
import { recentlyAdded } from "@/routes/recently-added/index.ts";
import { search } from "@/routes/search/index.ts";
import { manga } from "@/routes/manga/index.ts";

export const router = {
  health,
  catalog,
  latestUpdates,
  recentlyAdded,
  search,
  manga,
};
