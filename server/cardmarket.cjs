const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Cardmarket API v2 uses OAuth 1.0a. This is a minimal helper using PLAINTEXT/HMAC.
// You must set env vars: MKM_APP_TOKEN, MKM_APP_SECRET, MKM_ACCESS_TOKEN, MKM_ACCESS_SECRET

function buildOAuthHeader(method, url) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000);
  const consumerKey = process.env.MKM_APP_TOKEN;
  const consumerSecret = process.env.MKM_APP_SECRET;
  const token = process.env.MKM_ACCESS_TOKEN;
  const tokenSecret = process.env.MKM_ACCESS_SECRET;

  const params = {
    oauth_consumer_key: consumerKey,
    oauth_token: token,
    oauth_nonce: nonce,
    oauth_timestamp: timestamp,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };

  const baseParams = Object.keys(params)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const baseString = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(baseParams)].join('&');
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  const header = 'OAuth ' + [
    `oauth_consumer_key="${consumerKey}"`,
    `oauth_token="${token}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_signature_method="HMAC-SHA1"`,
    `oauth_version="1.0"`,
    `oauth_signature="${encodeURIComponent(signature)}"`
  ].join(', ');
  return header;
}

async function callMKM(endpoint, query = '') {
  const base = 'https://api.cardmarket.com/ws/v2.0/output.json';
  const url = `${base}${endpoint}${query ? `?${query}` : ''}`;
  const headers = { Authorization: buildOAuthHeader('GET', url), 'User-Agent': 'cardmarketapp/0.1' };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`MKM error ${res.status}`);
  return res.json();
}

let cachedOnePieceId = null;
async function ensureOnePieceGameId() {
  if (cachedOnePieceId) return cachedOnePieceId;
  const data = await callMKM('/games');
  const onePiece = data?.game?.find?.(g => /one\s*piece/i.test(g.name));
  if (!onePiece) throw new Error('One Piece game not found in MKM');
  cachedOnePieceId = onePiece.idGame;
  return cachedOnePieceId;
}

async function searchProducts(query, idGame) {
  // MKM products/find?search=...&idGame=xxx returns product list
  const q = `search=${encodeURIComponent(query)}&idGame=${encodeURIComponent(idGame)}`;
  const data = await callMKM('/products/find', q);
  const items = Array.isArray(data?.product) ? data.product : [];
  return items.map(p => ({
    name: p.enName || p.localization?.[0]?.name || p.name,
    card_code: p.number || '',
    cm_expansion: p.expansionName || '',
    cm_idProduct: p.idProduct,
    cm_idExpansion: p.idExpansion,
    rarity: p.rarity || '',
  }));
}

module.exports = { searchProducts, ensureOnePieceGameId };


