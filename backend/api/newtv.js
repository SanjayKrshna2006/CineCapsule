// Vercel Serverless Function for NetMirror NewTV Multi-Audio API
export default async function handler(req, res) {
  try {
    const id = req.query.id;
    const ott = req.query.ott || 'nf';
    if (!id) {
      return res.status(400).send('Missing id parameter');
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).send(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
