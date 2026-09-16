// Vercel Serverless API Handler for AnimeSalt Stream Resolver
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const tmdbId = req.query.id || '';
    const slug = req.query.slug || '';
    const rawTitle = req.query.title || slug;
    const season = req.query.s || req.query.season || '1';
    const episode = req.query.e || req.query.episode || '1';
    const isMovie = req.query.movie === 'true' || req.query.type === 'movie';
    const audio = (req.query.audio || req.query.server || 'sub').toLowerCase();
    const format = req.query.format;

    if (!slug && !rawTitle && !tmdbId) {
      return res.status(400).send('Missing anime title or slug');
    }

    const candidates = [];
    if (slug) candidates.push(slug);

    const cleanTitle = (rawTitle || slug)
      .toLowerCase()
      .replace(/[:\-—–()[\]{}"'’!?]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (cleanTitle && !candidates.includes(cleanTitle)) candidates.push(cleanTitle);

    const baseTitle = (rawTitle || slug)
      .split(/[:\-—–]/)[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (baseTitle && !candidates.includes(baseTitle)) candidates.push(baseTitle);

    let resolved = null;

    // 1. Direct candidate checks on animesalt.cx
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
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          if (pageRes.status === 200) {
            const html = await pageRes.text();
            const iframes = [...html.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map(m => m[1]);
            const { subPlayer, dubPlayer } = extractSubAndDub(iframes);

            if (subPlayer || dubPlayer) {
              resolved = {
                targetPage: targetUrl,
                subPlayer,
                dubPlayer,
                allIframes: iframes
              };
              break;
            }
          }
        } catch (e) {}
      }
      if (resolved) break;
    }

    // 2. Search on AnimeSalt with Scoring
    if (!resolved) {
      const searchTerms = [rawTitle, baseTitle, cleanTitle].filter(Boolean);
      for (const query of searchTerms) {
        try {
          const searchRes = await fetch(`https://animesalt.cx/?s=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });

          if (searchRes.status === 200) {
            const searchHtml = await searchRes.text();
            const matches = [...searchHtml.matchAll(/href="(https:\/\/animesalt\.cx\/(?:series|anime|movies|tvshows)\/([^"/]+)\/?)"/gi)];
            const searchSlugs = [...new Set(matches.map(m => m[2]))];

            searchSlugs.sort((a, b) => scoreSlugMatch(rawTitle || query, b) - scoreSlugMatch(rawTitle || query, a));

            for (const s of searchSlugs) {
              const epUrls = isMovie
                ? [`https://animesalt.cx/movies/${s}/`, `https://animesalt.cx/anime/${s}/`]
                : [
                    `https://animesalt.cx/episode/${s}-${season}x${episode}/`,
                    `https://animesalt.cx/episode/${s}-1x${episode}/`,
                    `https://animesalt.cx/episode/${s}-${episode}/`
                  ];

              for (const epUrl of epUrls) {
                const epRes = await fetch(epUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (epRes.status === 200) {
                  const epHtml = await epRes.text();
                  const iframes = [...epHtml.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map(m => m[1]);
                  const { subPlayer, dubPlayer } = extractSubAndDub(iframes);

                  if (subPlayer || dubPlayer) {
                    resolved = {
                      targetPage: epUrl,
                      subPlayer,
                      dubPlayer,
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

    // 3. Fallback
    if (!resolved) {
      const targetSlug = slug || cleanTitle || 'anime';
      const fallbackPage = isMovie
        ? `https://animesalt.cx/movies/${targetSlug}/`
        : `https://animesalt.cx/episode/${targetSlug}-${season}x${episode}/`;
      resolved = {
        targetPage: fallbackPage,
        subPlayer: fallbackPage,
        dubPlayer: fallbackPage,
        allIframes: [fallbackPage]
      };
    }

    if (format === 'json') {
      return res.status(200).json(resolved);
    }

    const isDub = audio.includes('dub') || audio === '2' || audio === 'server2';
    const finalPlayerUrl = isDub
      ? (resolved.dubPlayer || resolved.subPlayer || resolved.targetPage)
      : (resolved.subPlayer || resolved.dubPlayer || resolved.targetPage);

    return res.redirect(302, finalPlayerUrl);
  } catch (err) {
    console.error('[AnimeSalt Serverless Error]:', err.message);
    const targetSlug = req.query.slug || 'anime';
    return res.redirect(302, `https://animesalt.cx/episode/${targetSlug}-1x1/`);
  }
}

function scoreSlugMatch(query, slug) {
  const qWords = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 1);
  const sWords = slug.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 1);

  let score = 0;
  for (const qw of qWords) {
    if (sWords.some(sw => sw === qw)) {
      score += 2;
    } else if (sWords.some(sw => sw.includes(qw) || qw.includes(sw))) {
      score += 1;
    }
  }

  if (qWords[0] && slug.toLowerCase().includes(qWords[0])) score += 5;
  if (qWords[1] && slug.toLowerCase().includes(qWords[1])) score += 3;

  return score;
}

function extractSubAndDub(iframes) {
  if (!iframes || iframes.length === 0) return { subPlayer: null, dubPlayer: null };

  let subPlayer = null;
  let dubPlayer = null;

  for (const u of iframes) {
    if (u.includes('/dub') || u.includes('dub=') || u.includes('player.php') || u.includes('multi-lang')) {
      dubPlayer = u;
    }
    if (u.includes('/sub') || u.includes('sub=') || u.includes('as-cdn') || u.includes('/video/')) {
      if (!subPlayer) subPlayer = u;
    }
  }

  if (!subPlayer && iframes.length > 0) subPlayer = iframes[0];
  if (!dubPlayer && iframes.length > 1) dubPlayer = iframes[1];
  if (!dubPlayer) dubPlayer = subPlayer;

  return { subPlayer, dubPlayer };
}
