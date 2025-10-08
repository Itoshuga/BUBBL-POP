// utils/gifApi.js
const axios = require('axios');

// Chaque provider retourne une URL d'image/GIF pour une "action" donnée
// Actions supportées courantes: hug, kiss, pat, slap, cuddle, poke, dance, cry, highfive...

const providers = [
  // Waifu.pics (SFW)
  async (action) => {
    const supported = new Set(['hug', 'kiss', 'pat', 'slap', 'dance', 'cry', 'poke', 'highfive', 'wink', 'wave']);
    if (!supported.has(action)) throw new Error('unsupported');
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${action}`, { timeout: 8000 });
    if (!data?.url) throw new Error('no_url');
    return data.url;
  },

  // Nekos.best (SFW)
  async (action) => {
    const supported = new Set(['hug', 'kiss', 'pat', 'slap', 'dance', 'cry', 'wink', 'wave', 'handhold', 'highfive', 'poke']);
    if (!supported.has(action)) throw new Error('unsupported');
    const { data } = await axios.get(`https://nekos.best/api/v2/${action}`, { timeout: 8000 });
    const url = data?.results?.[0]?.url;
    if (!url) throw new Error('no_url');
    return url;
  },

  // Nekos.life v2
  async (action) => {
    const supported = new Set(['hug', 'kiss', 'pat', 'slap', 'cuddle', 'poke']);
    if (!supported.has(action)) throw new Error('unsupported');
    const { data } = await axios.get(`https://nekos.life/api/v2/img/${action}`, { timeout: 8000 });
    if (!data?.url) throw new Error('no_url');
    return data.url;
  },
];

// Essaie chaque provider jusqu’à obtenir une URL valide
async function fetchActionImage(action) {
  let lastErr;
  for (const p of providers) {
    try {
      const url = await p(action);
      if (typeof url === 'string' && url.startsWith('http')) return url;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('No provider available');
}

module.exports = { fetchActionImage };
