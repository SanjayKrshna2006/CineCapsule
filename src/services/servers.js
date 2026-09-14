// High-Reliability Streaming Server Providers with Instant Multi-Audio Feeds

export const ANIME_SERVER = {
  id: 'animesalt',
  name: 'Anime Server',
  getMovieUrl: (tmdbId) => `https://embedmaster.link/movie/${tmdbId}?multiLang=true&audio=all`,
  getTvUrl: (tmdbId, season = 1, episode = 1) => `https://embedmaster.link/tv/${tmdbId}/${season || 1}/${episode || 1}?multiLang=true&audio=all`
};

export const STREAM_SERVERS = [
  {
    id: 'netmirror',
    name: 'Server 1',
    getMovieUrl: (tmdbId) => `https://embedmaster.link/movie/${tmdbId}?multiLang=true&audio=all`,
    getTvUrl: (tmdbId, season = 1, episode = 1) => `https://embedmaster.link/tv/${tmdbId}/${season || 1}/${episode || 1}?multiLang=true&audio=all`
  },
  {
    id: 'twoembed',
    name: 'Server 2',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
    getTvUrl: (tmdbId, season = 1, episode = 1) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season || 1}&e=${episode || 1}`
  },
  {
    id: 'vidsrc',
    name: 'Server 3',
    getMovieUrl: (tmdbId) => `https://vidsrc.pm/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season = 1, episode = 1) => `https://vidsrc.pm/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`
  }
];

export function getStreamUrl(serverId, mediaType, tmdbId, season = 1, episode = 1, isAnime = false, mediaTitle = '') {
  if (serverId === 'animesalt') {
    return (mediaType === 'movie' || (!season && !episode))
      ? ANIME_SERVER.getMovieUrl(tmdbId)
      : ANIME_SERVER.getTvUrl(tmdbId, season || 1, episode || 1);
  }

  const allServers = [ANIME_SERVER, ...STREAM_SERVERS];
  const server = allServers.find(s => s.id === serverId) || (isAnime ? ANIME_SERVER : STREAM_SERVERS[0]);

  return (mediaType === 'tv')
    ? server.getTvUrl(tmdbId, season || 1, episode || 1)
    : server.getMovieUrl(tmdbId);
}
