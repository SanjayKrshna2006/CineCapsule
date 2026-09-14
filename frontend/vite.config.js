import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'video-stream-proxy',
      configureServer(server) {
        server.middlewares.use('/api/video-stream', async (req, res) => {
          try {
            const reqUrl = new URL(req.url, 'http://localhost:3000');
            const target = reqUrl.searchParams.get('url');
            if (!target) {
              res.writeHead(400);
              return res.end('Missing url parameter');
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
            console.error('[Video Proxy Error]:', err.message);
            if (!res.headersSent) res.writeHead(500);
            res.end();
          }
        });

        // NetMirror NewTV OTT API Handler (Netflix, Hotstar, Prime Video Multi-Audio)
        server.middlewares.use('/api/newtv', async (req, res) => {
          try {
            const reqUrl = new URL(req.url, 'http://localhost:3000');
            const id = reqUrl.searchParams.get('id');
            const ott = reqUrl.searchParams.get('ott') || 'nf';
            if (!id) {
              res.writeHead(400);
              return res.end('Missing id parameter');
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
            res.writeHead(response.status, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
          } catch (err) {
            console.error('[NewTV Proxy Error]:', err.message);
            if (!res.headersSent) res.writeHead(500);
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
        });

        // Universal AnimeSalt Stream Resolver with Auto-Search & Direct Player Engine
        const animeCache = new Map();

        
        // AnimeSalt Episodes List API Endpoint
        const epCache = new Map();
        server.middlewares.use('/api/animesalt-episodes', async (req, res) => {
          try {
            const reqUrl = new URL(req.url, 'http://localhost:3000');
            const slug = reqUrl.searchParams.get('slug') || '';
            const title = reqUrl.searchParams.get('title') || slug;

            if (!slug && !title) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Missing slug or title' }));
            }

            const cacheKey = slug || title;
            if (epCache.has(cacheKey)) {
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              return res.end(JSON.stringify(epCache.get(cacheKey)));
            }

            const candidates = [
              slug,
              (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            ].filter(Boolean);

            let html = '';
            for (const cand of candidates) {
              for (const prefix of ['anime', 'series']) {
                const targetUrl = `https://animesalt.cx/${prefix}/${cand}/`;
                try {
                  const pageRes = await fetch(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                  });
                  if (pageRes.status === 200) {
                    html = await pageRes.text();
                    break;
                  }
                } catch (e) {}
              }
              if (html) break;
            }

            if (!html) {
              try {
                const searchRes = await fetch(`https://animesalt.cx/?s=${encodeURIComponent(title || slug)}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (searchRes.status === 200) {
                  const sHtml = await searchRes.text();
                  const match = sHtml.match(/href="(https:\/\/animesalt\.cx\/(?:series|anime)\/([^"/]+)\/?)"/i);
                  if (match) {
                    const pageRes = await fetch(match[1], { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (pageRes.status === 200) {
                      html = await pageRes.text();
                    }
                  }
                }
              } catch (e) {}
            }

            const episodes = [];
            if (html) {
              const epMatches = [...html.matchAll(/href="(https:\/\/animesalt\.cx\/episode\/([^"]+)\/)"[^>]*>([\s\S]*?)<\/a>/gi)];
              const seen = new Set();
              for (const m of epMatches) {
                const epUrl = m[1];
                const epSlug = m[2];
                if (seen.has(epSlug)) continue;
                seen.add(epSlug);

                const seMatch = epSlug.match(/(\d+)x(\d+)/i);
                let season = 1;
                let episode = 1;
                if (seMatch) {
                  season = parseInt(seMatch[1], 10);
                  episode = parseInt(seMatch[2], 10);
                } else {
                  const singleNum = epSlug.match(/-(\d+)$/);
                  if (singleNum) episode = parseInt(singleNum[1], 10);
                }

                episodes.push({
                  id: epSlug,
                  episode_number: episode,
                  season_number: season,
                  name: `Episode ${episode}`,
                  url: epUrl,
                  slug: epSlug
                });
              }
              episodes.sort((a, b) => (a.season_number - b.season_number) || (a.episode_number - b.episode_number));
            }

            epCache.set(cacheKey, episodes);
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(episodes));
          } catch (err) {
            console.error('[AnimeSalt Episodes API Error]:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message, episodes: [] }));
          }
        });

        server.middlewares.use('/api/animesalt-stream', async (req, res) => {
          try {
            const reqUrl = new URL(req.url, 'http://localhost:3000');
            const tmdbId = reqUrl.searchParams.get('id') || '';
            const slug = reqUrl.searchParams.get('slug') || '';
            const rawTitle = reqUrl.searchParams.get('title') || slug;
            const season = reqUrl.searchParams.get('s') || reqUrl.searchParams.get('season') || '1';
            const episode = reqUrl.searchParams.get('e') || reqUrl.searchParams.get('episode') || '1';
            const isMovie = reqUrl.searchParams.get('movie') === 'true' || reqUrl.searchParams.get('type') === 'movie';
            const format = reqUrl.searchParams.get('format');

            if (!slug && !rawTitle && !tmdbId) {
              res.writeHead(400);
              return res.end('Missing anime title or slug');
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

              // 1. Try direct candidate URLs on AnimeSalt
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
                  } catch (e) {
                    // Continue to next candidate
                  }
                }
                if (resolved) break;
              }

              // 2. If not found, try live search on AnimeSalt
              if (!resolved) {
                const searchTerms = [baseTitle, cleanTitle, rawTitle, slug].filter(Boolean);
                for (const query of searchTerms) {
                  try {
                    const searchRes = await fetch(`https://animesalt.cx/?s=${encodeURIComponent(query)}`, {
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                      }
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
                          const epRes = await fetch(epUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                          });

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
                  } catch (err) {
                    // search error, continue
                  }
                  if (resolved) break;
                }
              }

              // 3. Fallback to resilient Multi-Audio Master Feed if AnimeSalt didn't have this specific title/episode
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
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              return res.end(JSON.stringify(resolved));
            }

            // Redirect directly to the CDN player for seamless embed inside iframe
            const finalPlayerUrl = resolved.cdnPlayer || resolved.targetPage;
            res.writeHead(302, {
              'Location': finalPlayerUrl,
              'Access-Control-Allow-Origin': '*'
            });
            res.end();
          } catch (err) {
            console.error('[AnimeSalt Proxy Error]:', err.message);
            if (!res.headersSent) res.writeHead(500);
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      '/api/netmirror': {
        target: 'https://net27.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/netmirror/, '/api/embed-tmdb'),
        headers: {
          'Referer': 'https://videodownloader.site/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    }
  }
});
