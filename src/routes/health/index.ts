import { Hono } from "hono";

export const health = new Hono();

health.get("/", (c) => c.text("OK"));
