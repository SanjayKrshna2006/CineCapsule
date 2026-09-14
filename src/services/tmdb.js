// TMDB API Service with full Movie, TV Series, and Anime support

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = '1cf50e6248dc270629e802686245c2c8';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TMDB_GENRES = {
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' }
  ],
  tv: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10768, name: 'War & Politics' }
  ],
  anime: [
    { id: 'trending', name: '🔥 Trending Anime' },
    { id: 'action', name: '⚔️ Shonen & Action', genreId: 10759 },
    { id: 'fantasy', name: '✨ Fantasy & Isekai', genreId: 10765 },
    { id: 'comedy', name: '😂 Comedy', genreId: 35 },
    { id: 'mystery', name: '🕵️ Mystery & Thriller', genreId: 9648 },
    { id: 'drama', name: '🎭 Drama & Slice of Life', genreId: 18 },
    { id: 'movies', name: '🎬 Anime Movies', isMovie: true }
  ]
};

export function getImageUrl(path, size = 'w500') {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path, size = 'original') {
  if (!path) return 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1600&auto=format&fit=crop';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

async function fetchFromTmdb(endpoint, params = {}) {
  const query = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    ...params
  });

  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const tmdb = {
  // Hero / Featured content
  async getHeroFeatured() {
    try {
      const data = await fetchFromTmdb('/trending/all/day');
      // Pick high rating items with good backdrops
      const candidates = (data.results || []).filter(item => item.backdrop_path && item.vote_average >= 7);
      return candidates.slice(0, 8);
    } catch (err) {
      console.error('getHeroFeatured error', err);
      return [];
    }
  },

  // Home rows
  async getHomeRows() {
    try {
      const [trendingMovies, trendingTv, popularAnime, topRatedMovies, netflixShows, animeMovies] = await Promise.all([
        fetchFromTmdb('/trending/movie/week'),
        fetchFromTmdb('/trending/tv/week'),
        fetchFromTmdb('/discover/tv', {
          with_genres: 16,
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        }),
        fetchFromTmdb('/movie/top_rated'),
        fetchFromTmdb('/discover/tv', {
          with_networks: '213', // Netflix
          sort_by: 'popularity.desc'
        }),
        fetchFromTmdb('/discover/movie', {
          with_genres: 16,
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        })
      ]);

      return [
        { title: '🔥 Trending Movies', type: 'movie', items: (trendingMovies.results || []).map(i => ({ ...i, media_type: 'movie' })) },
        { title: '📺 Trending TV Series', type: 'tv', items: (trendingTv.results || []).map(i => ({ ...i, media_type: 'tv' })) },
        { title: '⚡ Popular Anime Series', type: 'anime', items: (popularAnime.results || []).map(i => ({ ...i, media_type: 'tv', isAnime: true })) },
        { title: '⭐ All-Time Masterpieces', type: 'movie', items: (topRatedMovies.results || []).map(i => ({ ...i, media_type: 'movie' })) },
        { title: '🎬 Feature Anime Films', type: 'anime', items: (animeMovies.results || []).map(i => ({ ...i, media_type: 'movie', isAnime: true })) },
        { title: '🍿 Hit TV Series', type: 'tv', items: (netflixShows.results || []).map(i => ({ ...i, media_type: 'tv' })) }
      ];
    } catch (err) {
      console.error('getHomeRows error', err);
      return [];
    }
  },

  // Movies
  async getMovies(category = 'popular', genreId = null, page = 1) {
    try {
      let endpoint = `/movie/${category}`;
      const params = { page };
      if (genreId) {
        endpoint = '/discover/movie';
        params.with_genres = genreId;
        params.sort_by = 'popularity.desc';
      }
      const data = await fetchFromTmdb(endpoint, params);
      return (data.results || []).map(item => ({ ...item, media_type: 'movie' }));
    } catch (err) {
      console.error('getMovies error', err);
      return [];
    }
  },

  // TV Series
  async getTvSeries(category = 'popular', genreId = null, page = 1) {
    try {
      let endpoint = `/tv/${category}`;
      const params = { page };
      if (genreId) {
        endpoint = '/discover/tv';
        params.with_genres = genreId;
        params.sort_by = 'popularity.desc';
      }
      const data = await fetchFromTmdb(endpoint, params);
      return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
    } catch (err) {
      console.error('getTvSeries error', err);
      return [];
    }
  },

  // Anime
  async getAnime(category = 'trending', genreId = null, page = 1) {
    try {
      if (category === 'movies') {
        const data = await fetchFromTmdb('/discover/movie', {
          page,
          with_genres: 16,
          with_original_language: 'ja',
          sort_by: 'popularity.desc'
        });
        return (data.results || []).map(item => ({ ...item, media_type: 'movie', isAnime: true }));
      }

      const params = {
        page,
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: 'popularity.desc'
      };

      if (genreId) {
        params.with_genres = `16,${genreId}`;
      }

      const data = await fetchFromTmdb('/discover/tv', params);
      return (data.results || []).map(item => ({ ...item, media_type: 'tv', isAnime: true }));
    } catch (err) {
      console.error('getAnime error', err);
      return [];
    }
  },

  // Details
  async getDetails(id, mediaType = 'movie') {
    const type = mediaType === 'anime' ? 'tv' : mediaType;
    try {
      const data = await fetchFromTmdb(`/${type}/${id}`, {
        append_to_response: 'credits,videos,recommendations,similar'
      });
      return {
        ...data,
        media_type: type
      };
    } catch (err) {
      console.error('getDetails error', err);
      return null;
    }
  },

  // TV Season Episodes
  async getSeasonDetails(tvId, seasonNumber) {
    try {
      const data = await fetchFromTmdb(`/tv/${tvId}/season/${seasonNumber}`);
      return data.episodes || [];
    } catch (err) {
      console.error('getSeasonDetails error', err);
      return [];
    }
  },

  // Search
  async searchMulti(query) {
    if (!query || !query.trim()) return [];
    try {
      const data = await fetchFromTmdb('/search/multi', { query: query.trim() });
      return (data.results || []).filter(
        item => (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path)
      ).map(item => {
        const isAnime = item.original_language === 'ja' && (item.genre_ids?.includes(16) || false);
        return {
          ...item,
          isAnime
        };
      });
    } catch (err) {
      console.error('searchMulti error', err);
      return [];
    }
  }
};
