import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable Cross-Origin Resource Sharing for all client frontends
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

app.use(express.json());

// Health Check & Root
app.get('/', (req, res) => {
  res.json({
    name: 'CineCapsule Streaming Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/animesalt-stream',
      '/api/newtv',
      '/api/video-stream'
    ]
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// NetMirror NewTV OTT API Handler (Netflix, Hotstar, Prime Video Multi-Audio)
app.get('/api/newtv', async (req, res) => {
  try {
    const id = req.query.id;
    const ott = req.query.ott || 'nf';
    if (!id) {
      return res.status(400).json({ status: 'error', message: 'Missing id parameter' });
    }

    const response = await fetch(`https://tv.imgcdn.kim/newtv/player.php?id=${id}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'NetmirrorNewTV v1.0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0 /OS.GatuNewTV v1.0',
        'Accept': 'application/json, text/plain, */*',
        'Ott': ott
      }
    });

    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(data);
  } catch (err) {
    console.error('[NewTV Proxy Error]:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Video Range & Chunk Streamer
app.get('/api/video-stream', async (req, res) => {
  try {
    const target = req.query.url;
    if (!target) {
      return res.status(400).send('Missing url parameter');
    }

    const headers = {
      'Referer': 'https://videodownloader.site/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const remote = await fetch(target, { headers });

    const responseHeaders = {
      'Content-Type': remote.headers.get('content-type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    };

    const cl = remote.headers.get('content-length');
    if (cl) responseHeaders['Content-Length'] = cl;

    const cr = remote.headers.get('content-range');
    if (cr) responseHeaders['Content-Range'] = cr;

    res.writeHead(remote.status, responseHeaders);

    if (!remote.body) {
      return res.end();
    }

    const reader = remote.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error('[Video Stream Error]:', err.message);
    if (!res.headersSent) res.status(500);
    res.end();
  }
});

// Universal AnimeSalt Stream Resolver Engine
const animeCache = new Map();

app.get('/api/animesalt-stream', async (req, res) => {
  try {
    const tmdbId = req.query.id || '';
    const slug = req.query.slug || '';
    const rawTitle = req.query.title || slug;
    const season = req.query.s || req.query.season || '1';
    const episode = req.query.e || req.query.episode || '1';
    const isMovie = req.query.movie === 'true' || req.query.type === 'movie';
    const format = req.query.format;

    if (!slug && !rawTitle && !tmdbId) {
      return res.status(400).send('Missing anime title or slug');
    }

    const cacheKey = `${tmdbId}-${slug || rawTitle}-${isMovie ? 'movie' : `${season}x${episode}`}`;
    let resolved = animeCache.get(cacheKey);

    if (!resolved) {
      const candidates = [];
      if (slug) candidates.push(slug);

      const cleanTitle = (rawTitle || slug)
        .toLowerCase()
        .replace(/[:\-–—()[\]{}"'’!?]/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (cleanTitle && !candidates.includes(cleanTitle)) candidates.push(cleanTitle);

      const baseTitle = (rawTitle || slug)
        .split(/[:\-–—]/)[0]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (baseTitle && !candidates.includes(baseTitle)) candidates.push(baseTitle);

      // 1. Direct candidate checks
      for (const cand of candidates) {
        const targetUrls = isMovie
          ? [`https://animesalt.cx/movies/${cand}/`, `https://animesalt.cx/anime/${cand}/`]
          : [
              `https://animesalt.cx/episode/${cand}-${season}x${episode}/`,
              `https://animesalt.cx/episode/${cand}-1x${episode}/`,
              `https://animesalt.cx/episode/${cand}-${episode}/`
            ];

        for (const targetUrl of targetUrls) {
          try {
            const pageRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              }
            });

            if (pageRes.status === 200) {
              const html = await pageRes.text();
              const iframes = [...html.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map(m => m[1]);
              const cdnPlayer = iframes.find(u => u.includes('as-cdn') || u.includes('/video/'));
              const multiLangPlayer = iframes.find(u => u.includes('player.php') || u.includes('multi-lang'));

              if (cdnPlayer || multiLangPlayer) {
                resolved = {
                  targetPage: targetUrl,
                  cdnPlayer: cdnPlayer || multiLangPlayer,
                  multiLangPlayer: multiLangPlayer || null,
                  allIframes: iframes
                };
                break;
              }
            }
          } catch (e) {}
        }
        if (resolved) break;
      }

      // 2. Search fallback
      if (!resolved) {
        const searchTerms = [baseTitle, cleanTitle, rawTitle, slug].filter(Boolean);
        for (const query of searchTerms) {
          try {
            const searchRes = await fetch(`https://animesalt.cx/?s=${encodeURIComponent(query)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (searchRes.status === 200) {
              const searchHtml = await searchRes.text();
              const matches = [...searchHtml.matchAll(/href="(https:\/\/animesalt\.cx\/(?:series|anime|movies|tvshows)\/([^"/]+)\/?)"/gi)];
              const searchSlugs = matches.map(m => ({ url: m[1], slug: m[2], isMovieLink: m[1].includes('/movies/') }));
              searchSlugs.sort((a, b) => (isMovie ? (b.isMovieLink - a.isMovieLink) : (a.isMovieLink - b.isMovieLink)));

              for (const s of searchSlugs) {
                const epUrls = isMovie
                  ? [`https://animesalt.cx/movies/${s.slug}/`, `https://animesalt.cx/anime/${s.slug}/`]
                  : [
                      `https://animesalt.cx/episode/${s.slug}-${season}x${episode}/`,
                      `https://animesalt.cx/episode/${s.slug}-1x${episode}/`,
                      `https://animesalt.cx/episode/${s.slug}-${episode}/`
                    ];

                for (const epUrl of epUrls) {
                  const epRes = await fetch(epUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                  if (epRes.status === 200) {
                    const epHtml = await epRes.text();
                    const iframes = [...epHtml.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map(m => m[1]);
                    const cdnPlayer = iframes.find(u => u.includes('as-cdn') || u.includes('/video/'));
                    const multiLangPlayer = iframes.find(u => u.includes('player.php') || u.includes('multi-lang'));

                    if (cdnPlayer || multiLangPlayer) {
                      resolved = {
                        targetPage: epUrl,
                        cdnPlayer: cdnPlayer || multiLangPlayer,
                        multiLangPlayer: multiLangPlayer || null,
                        allIframes: iframes
                      };
                      break;
                    }
                  }
                }
                if (resolved) break;
              }
            }
          } catch (err) {}
          if (resolved) break;
        }
      }

      // 3. Fallback to HD Multi-Audio Master Feed
      if (!resolved) {
        if (tmdbId) {
          const fallbackEmbed = isMovie
            ? `https://embedmaster.link/movie/${tmdbId}?multiLang=true&audio=all`
            : `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}?multiLang=true&audio=all`;

          resolved = {
            targetPage: fallbackEmbed,
            cdnPlayer: fallbackEmbed,
            allIframes: [fallbackEmbed]
          };
        } else {
          const fallbackPage = isMovie
            ? `https://animesalt.cx/movies/${slug}/`
            : `https://animesalt.cx/episode/${slug}-${season}x${episode}/`;
          resolved = {
            targetPage: fallbackPage,
            cdnPlayer: fallbackPage,
            allIframes: []
          };
        }
      }

      animeCache.set(cacheKey, resolved);
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(resolved);
    }

    const finalPlayerUrl = resolved.cdnPlayer || resolved.targetPage;
    return res.redirect(302, finalPlayerUrl);
  } catch (err) {
    console.error('[AnimeSalt Backend Error]:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CineCapsule Backend Server running on port ${PORT}`);
});
