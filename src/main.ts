import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { cache } from "hono/cache";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { secureHeaders } from "hono/secure-headers";
import { router } from "@/routes/index.ts";

const app = new Hono();

app.use(compress());
app.use("*", etag());
app.use("*", async (c, next) => {
  await next();
  c.header("x-powered-by", "your mom, and mangadex too ig");
});
app.use(secureHeaders());

app.get(
  "*",
  cache({
    cacheName: "mangadex-opds",
    cacheControl: "max-age=3600",
    wait: true,
  }),
);

app.use("/static/*", serveStatic({ root: "./src" }));
app.get("/", serveStatic({ path: "./src/static/index.html" }));

app.route("/health", router.health);

app.route("/v1.2/catalog", router.catalog);
app.route("/v1.2/seasonal", router.seasonal);
app.route("/v1.2/latest-updates", router.latestUpdates);
app.route("/v1.2/recently-added", router.recentlyAdded);

app.route("/v1.2/search", router.search);

app.route("/v1.2/manga", router.manga);

Deno.serve({ port: 3000 }, app.fetch);
