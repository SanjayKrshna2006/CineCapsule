// High-Reliability Streaming Server Providers with Fast Multi-Audio Feeds

export function cleanAnimeSlug(title = '') {
  let s = (title || '').toLowerCase().trim();

  // Comprehensive Slug Dictionary for Anime Titles
  if (s.includes('demon slayer') || s.includes('kimetsu no yaiba')) return 'demon-slayer';
  if (s.includes('attack on titan') || s.includes('shingeki no kyojin')) return 'attack-on-titan';
  if (s.includes('my hero academia') || s.includes('boku no hero')) return 'my-hero-academia';
  if (s.includes('jujutsu kaisen')) return 'jujutsu-kaisen';
  if (s.includes('solo leveling')) return 'solo-leveling';
  if (s.includes('chainsaw man')) return 'chainsaw-man';
  if (s.includes('one piece')) return 'one-piece';
  if (s.includes('naruto shippuden')) return 'naruto-shippuden';
  if (s.includes('naruto')) return 'naruto';
  if (s.includes('bleach thousand') || s.includes('thousand-year blood war')) return 'bleach-thousand-year-blood-war';
  if (s.includes('bleach')) return 'bleach';
  if (s.includes('your name') || s.includes('kimi no na wa')) return 'your-name.';
  if (s.includes('spirited away') || s.includes('sen to chihiro')) return 'spirited-away';
  if (s.includes('death note')) return 'death-note';
  if (s.includes('fullmetal alchemist brotherhood')) return 'fullmetal-alchemist-brotherhood';
  if (s.includes('fullmetal alchemist')) return 'fullmetal-alchemist';
  if (s.includes('hunter x hunter') || s.includes('hunter')) return 'hunter-x-hunter';
  if (s.includes('tokyo ghoul')) return 'tokyo-ghoul';
  if (s.includes('one punch man')) return 'one-punch-man';
  if (s.includes('dragon ball super')) return 'dragon-ball-super';
  if (s.includes('dragon ball z')) return 'dragon-ball-z';
  if (s.includes('dragon ball daima')) return 'dragon-ball-daima';
  if (s.includes('dragon ball')) return 'dragon-ball';
  if (s.includes('dandadan') || s.includes('dan da dan')) return 'dan-da-dan';
  if (s.includes('blue lock')) return 'blue-lock';
  if (s.includes('kaiju no') || s.includes('kaiju 8')) return 'kaiju-no.-8';
  if (s.includes('frieren') || s.includes('beyond journey')) return 'frieren-beyond-journeys-end';
  if (s.includes('spy x family') || s.includes('spy family')) return 'spy-x-family';
  if (s.includes('wind breaker')) return 'wind-breaker';
  if (s.includes('vinland saga')) return 'vinland-saga';
  if (s.includes('haikyuu') || s.includes('haikyu')) return 'haikyu';
  if (s.includes('black clover')) return 'black-clover';
  if (s.includes('dr. stone') || s.includes('dr stone')) return 'dr-stone';
  if (s.includes('classroom of the elite')) return 'classroom-of-the-elite';
  if (s.includes('mushoku tensei') || s.includes('jobless reincarnation')) return 'mushoku-tensei-jobless-reincarnation';
  if (s.includes('sword art online')) return 'sword-art-online';
  if (s.includes('tokyo revengers')) return 'tokyo-revengers';
  if (s.includes('hell\'s paradise') || s.includes('jigokuraku')) return 'hells-paradise';
  if (s.includes('oshi no ko')) return 'oshi-no-ko';
  if (s.includes('overlord')) return 'overlord';
  if (s.includes('re:zero') || s.includes('rezero')) return 're-zero-starting-life-in-another-world';
  if (s.includes('mob psycho')) return 'mob-psycho-100';
  if (s.includes('violet evergarden')) return 'violet-evergarden';
  if (s.includes('neon genesis evangelion') || s.includes('evangelion')) return 'neon-genesis-evangelion';
  if (s.includes('cowboy bebop')) return 'cowboy-bebop';
  if (s.includes('cyberpunk edgerunners') || s.includes('edgerunners')) return 'cyberpunk-edgerunners';

  return s
    .replace(/[:\-–—()[\]{}"'’!?]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ANIME_SERVER = {
  id: 'animesalt',
  name: 'Anime Server',
  getMovieUrl: (tmdbId, title = '') => `https://embedmaster.link/movie/${tmdbId}?multiLang=true&audio=all`,
  getTvUrl: (tmdbId, season = 1, episode = 1, title = '') => `https://embedmaster.link/tv/${tmdbId}/${season || 1}/${episode || 1}?multiLang=true&audio=all`
};

export const STREAM_SERVERS = [
  {
    id: 'netmirror',
    name: 'Server 1',
    getMovieUrl: (tmdbId) => `https://embedmaster.link/movie/${tmdbId}?multiLang=true&audio=all`,
    getTvUrl: (tmdbId, season, episode) => `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}?multiLang=true&audio=all`
  },
  {
    id: 'twoembed',
    name: 'Server 2',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
  },
  {
    id: 'vidsrc',
    name: 'Server 3',
    getMovieUrl: (tmdbId) => `https://vidsrc.pm/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`
  }
];

export function getStreamUrl(serverId, mediaType, tmdbId, season = 1, episode = 1, isAnime = false, mediaTitle = '') {
  // Use Anime Server exclusively for Anime titles
  if (mediaType === 'anime' || isAnime || serverId === 'animesalt') {
    return (mediaType === 'movie' || (!season && !episode))
      ? ANIME_SERVER.getMovieUrl(tmdbId, mediaTitle)
      : ANIME_SERVER.getTvUrl(tmdbId, season, episode, mediaTitle);
  }

  let server = STREAM_SERVERS.find(s => s.id === serverId) || STREAM_SERVERS[0];

  return (mediaType === 'tv')
    ? server.getTvUrl(tmdbId, season || 1, episode || 1)
    : server.getMovieUrl(tmdbId);
}
