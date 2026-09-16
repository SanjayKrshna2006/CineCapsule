import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Score similarity between query and AnimeSalt slug
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

  if (qWords[0] && slug.toLowerCase().includes(qWords[0])) {
    score += 5;
  }
  if (qWords[1] && slug.toLowerCase().includes(qWords[1])) {
    score += 3;
  }

  return score;
}

// Universal AnimeSalt Stream Resolver Engine (100% on animesalt.cx)
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
        .replace(/[:\-—–()[\]{}"'’!?]/g, ' ')
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
              resolved = {
                targetPage: targetUrl,
                animesaltPage: targetUrl
              };
              break;
            }
          } catch (e) {}
        }
        if (resolved) break;
      }

      // 2. Intelligent Search on animesalt.cx with Title Scoring
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
                    resolved = {
                      targetPage: epUrl,
                      animesaltPage: epUrl
                    };
                    break;
                  }
                }
                if (resolved) break;
              }
            }
          } catch (err) {}
          if (resolved) break;
        }
      }

      // 3. Guaranteed animesalt.cx direct episode URL
      if (!resolved) {
        const targetSlug = slug || cleanTitle || 'anime';
        const fallbackPage = isMovie
          ? `https://animesalt.cx/movies/${targetSlug}/`
          : `https://animesalt.cx/episode/${targetSlug}-${season}x${episode}/`;
        resolved = {
          targetPage: fallbackPage,
          animesaltPage: fallbackPage
        };
      }

      animeCache.set(cacheKey, resolved);
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(resolved);
    }

    // STRICT REDIRECT TO animesalt.cx DIRECTLY
    const finalAnimeUrl = resolved.targetPage || resolved.animesaltPage;
    return res.redirect(302, finalAnimeUrl);
  } catch (err) {
    console.error('[AnimeSalt Backend Error]:', err.message);
    const targetSlug = req.query.slug || 'anime';
    return res.redirect(302, `https://animesalt.cx/episode/${targetSlug}-1x1/`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CineCapsule Backend Server running on port ${PORT}`);
});
