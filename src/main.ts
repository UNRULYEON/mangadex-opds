import { Hono, Context } from 'hono';
import { cache } from 'hono/cache';
import { stringify } from '@libs/xml/stringify';
import { mangas, chapters, pages } from '@/repository/index.ts';
import { compress } from 'hono/compress';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';

const app = new Hono();

app.use(compress());
app.use('*', etag());
app.use(secureHeaders());

app.get(
  '*',
  cache({
    cacheName: 'mangadex-opds',
    cacheControl: 'max-age=3600',
    wait: true,
  })
);

app.get('/health', (c: Context) => {
  return c.text('OK');
});

app.get('/v1.2/catalog', (c: Context) => {
  c.header('Content-Type', 'application/xml');

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id: 'root',
        title: 'MangaDex OPDS Feed',
        updated: new Date().toISOString(),
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        link: [
          {
            '@type':
              'application/atom+xml;profile=opds-catalog;kind=navigation',
            '@rel': 'self',
            '@href': '/v1.2/catalog',
          },
          {
            '@type':
              'application/atom+xml;profile=opds-catalog;kind=navigation',
            '@rel': 'start',
            '@href': '/v1.2/catalog',
          },
          {
            '@type': 'application/opensearchdescription+xml',
            '@rel': 'search',
            '@href': '/v1.2/search',
          },
          {
            '@type': 'application/opds+json',
            '@rel': 'alternate',
            '@href': '/v1.2/catalog',
          },
        ],
        entry: [
          {
            title: 'Latest updates',
            id: 'latestUpdates',
            content: 'Manga that have been recently updated',
            link: {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': '/v1.2/latest-updates',
            },
          },
          {
            title: 'Recently added',
            id: 'keepReading',
            content: 'Manga recently added to the catalog',
            link: {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': '/v1.2/recently-added',
            },
          },
        ],
      },
    })
  );
});

app.get('/v1.2/latest-updates', async (c: Context) => {
  const page = c.req.query('page');
  const LIMIT = 10;
  const OFFSET = page ? parseInt(page) * LIMIT : 0;

  const data = await mangas.get.all({
    limit: LIMIT,
    offset: OFFSET,
    includes: {
      user: true,
      scanlationGroup: true,
      manga: true,
    },
    contentRating: {
      safe: true,
      suggestive: true,
      erotica: true,
    },
    order: {
      reabableAt: 'desc',
    },
  });

  c.header('Content-Type', 'application/xml');

  const links = [
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'self',
      '@href': '/v1.2/recently-added',
    },
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'start',
      '@href': '/v1.2/catalog',
    },
    page && {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'previous',
      '@href': `/v1.2/recently-added?page=${parseInt(page) - 1}`,
    },
    // page !== '10' && {
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'next',
      '@href': `/v1.2/recently-added?page=${parseInt(page ?? '0') + 1}`,
    },
  ].filter(Boolean);

  if (!data) {
    return c.body(
      stringify({
        feed: {
          '@xmlns': 'http://www.w3.org/2005/Atom',
          id: 'recently-added',
          title: 'Recently added',
          updated: new Date().toISOString(),
          author: {
            name: 'MangaDex OPDS',
            uri: 'https://github.com/UNRULYEON/mangadex-opds',
          },
          link: [...links],
        },
      })
    );
  }

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id: 'recently-added',
        title: 'Recently added',
        updated: new Date().toISOString(),
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        link: [...links],
        entry: data.map((manga) => ({
          title: manga.title,
          id: manga.id,
          updated: manga.updatedAt,
          link: [
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image/thumbnail',
              '@href': manga.coverUrl,
            },
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image',
              '@href': manga.coverUrl,
            },
            {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': `/v1.2/manga/${manga.id}`,
            },
          ],
        })),
      },
    })
  );
});

app.get('/v1.2/recently-added', async (c: Context) => {
  const page = c.req.query('page');
  const LIMIT = 10;
  const OFFSET = page ? parseInt(page) * LIMIT : 0;

  const data = await mangas.get.all({
    limit: LIMIT,
    offset: OFFSET,
    order: {
      createdAt: 'desc',
    },
    hasAvailableChapters: true,
  });

  c.header('Content-Type', 'application/xml');

  const links = [
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'self',
      '@href': '/v1.2/recently-added',
    },
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'start',
      '@href': '/v1.2/catalog',
    },
    page && {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'previous',
      '@href': `/v1.2/recently-added?page=${parseInt(page) - 1}`,
    },
    // page !== '10' && {
    {
      '@type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      '@rel': 'next',
      '@href': `/v1.2/recently-added?page=${parseInt(page ?? '0') + 1}`,
    },
  ].filter(Boolean);

  if (!data) {
    return c.body(
      stringify({
        feed: {
          '@xmlns': 'http://www.w3.org/2005/Atom',
          id: 'recently-added',
          title: 'Recently added',
          updated: new Date().toISOString(),
          author: {
            name: 'MangaDex OPDS',
            uri: 'https://github.com/UNRULYEON/mangadex-opds',
          },
          link: [...links],
        },
      })
    );
  }

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id: 'recently-added',
        title: 'Recently added',
        updated: new Date().toISOString(),
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        link: [...links],
        entry: data.map((manga) => ({
          title: manga.title,
          id: manga.id,
          updated: manga.updatedAt,
          link: [
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image/thumbnail',
              '@href': manga.coverUrl,
            },
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image',
              '@href': manga.coverUrl,
            },
            {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': `/v1.2/manga/${manga.id}`,
            },
          ],
        })),
      },
    })
  );
});

app.get('/v1.2/manga', async (c: Context) => {
  const { search } = c.req.query();

  const data = await mangas.get.all({
    title: search,
    hasAvailableChapters: true,
  });

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id: 'root',
        title: 'MangaDex OPDS Feed',
        updated: new Date().toISOString(),
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        link: [
          {
            '@type':
              'application/atom+xml;profile=opds-catalog;kind=navigation',
            '@rel': 'self',
            '@href': '/v1.2/manga',
          },
        ],

        entry: data.map((manga) => ({
          title: manga.title,
          id: manga.id,
          updated: manga.updatedAt,
          link: [
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image/thumbnail',
              '@href': manga.coverUrl,
            },
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image',
              '@href': manga.coverUrl,
            },
            {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': `/v1.2/manga/${manga.id}`,
            },
          ],
        })),
      },
    })
  );
});

app.get('/v1.2/search', (c: Context) => {
  c.header('Content-Type', 'application/xml');

  return c.body(
    stringify({
      OpenSearchDescription: {
        '@xmlns': 'http://a9.com/-/spec/opensearch/1.1/',
        ShortName: 'Search',
        Description: 'Search for mangas',
        InputEncoding: 'UTF-8',
        OutputEncoding: 'UTF-8',
        Url: {
          '@template': '/v1.2/manga?search={searchTerms}',
          '@type': 'application/atom+xml;profile=opds-catalog;kind=acquisition',
        },
      },
    })
  );
});

app.get('/v1.2/manga/:id', async (c: Context) => {
  const { id } = c.req.param();

  const result = await mangas.get.byId({ id });

  if (!result) {
    return c.text('Not found', 404);
  }

  c.header('Content-Type', 'application/xml');

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id,
        title: result.title,
        updated: result.updatedAt,
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        entry: result.availableTranslatedLanguages.map((lang: string) => ({
          title: `${result.title} (${lang.toUpperCase()})`,
          id: lang,
          link: [
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image/thumbnail',
              '@href': result.coverUrl,
            },
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image',
              '@href': result.coverUrl,
            },
            {
              '@type':
                'application/atom+xml;profile=opds-catalog;kind=navigation',
              '@rel': 'subsection',
              '@href': `/v1.2/manga/${id}/language/${lang}`,
            },
          ],
        })),
      },
    })
  );
});

app.get('/v1.2/manga/:id/language/:lang', async (c: Context) => {
  const { id, lang } = c.req.param();

  const result = await chapters.get.all({
    id,
    lang,
  });

  if (result.length === 0) {
    return c.text('Not found', 404);
  }

  c.header('Content-Type', 'application/xml');

  return c.body(
    stringify({
      feed: {
        '@xmlns': 'http://www.w3.org/2005/Atom',
        id,
        title: result[0].manga.title,
        updated: new Date().toISOString(),
        author: {
          name: 'MangaDex OPDS',
          uri: 'https://github.com/UNRULYEON/mangadex-opds',
        },
        entry: result.map((chapter) => ({
          title: `${chapter.manga.title} - Chapter ${chapter.chapter}`,
          id: chapter.id,
          updated: chapter.updatedAt,
          content: 'cbz - 179.6 MiB',
          link: [
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image/thumbnail',
              '@href': chapter.manga.coverUrl,
            },
            {
              '@type': 'image/jpg',
              '@rel': 'http://opds-spec.org/image',
              '@href': chapter.manga.coverUrl,
            },
            {
              '@type': 'application/zip',
              '@rel': 'http://opds-spec.org/acquisition',
              '@href': `/v1.2/manga/${id}/language/${lang}/chapter/${chapter.id}`,
            },
            {
              '@xmlns:wstxns11': 'http://vaemendis.net/opds-pse/ns',
              '@href': `/v1.2/manga/${id}/language/${lang}/chapter/${chapter.id}?page={pageNumber}`,
              '@wstxns11:count': chapter.pages,
              '@type': 'image/jpg',
              '@rel': 'http://vaemendis.net/opds-pse/stream',
            },
          ],
        })),
      },
    })
  );
});

app.get(
  '/v1.2/manga/:id/language/:lang/chapter/:chapterId',
  async (c: Context) => {
    const { id, chapterId } = c.req.param();
    const { page } = c.req.query();

    if (page) {
      const result = await pages.get.byId({
        chapterId,
        pageNumber: page,
      });

      c.header('Content-Type', 'image/jpeg');
      c.header('Content-Disposition', `inline; filename=${result.filename}`);

      return c.body(result.buffer);
    }

    const result = await chapters.get.byId({
      chapterId,
    });

    c.header('Content-Type', 'x-rar-compressed');
    c.header('Content-Disposition', `attachment; filename=${id}.cbz`);

    return c.body(result);
  }
);

Deno.serve({ port: 3000 }, app.fetch);
