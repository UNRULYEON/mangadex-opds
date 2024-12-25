import { Hono, Context } from 'hono';

const app = new Hono();

app.get('/health', (c: Context) => {
  return c.text('OK');
});

Deno.serve({ port: 3000 }, app.fetch);
