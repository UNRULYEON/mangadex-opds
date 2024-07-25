import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.text("OK");
});

export default app;
