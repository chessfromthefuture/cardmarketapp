const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { searchProducts, ensureOnePieceGameId } = require('./cardmarket.cjs');
const { ocrService } = require('./ocr-service.cjs');
const { CardMatcher } = require('./card-matcher.cjs');
const { CardNumberRecognizer } = require('./card-ocr.cjs');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });

const DATA_DIR = path.join(__dirname, '..', 'data_cache');
const ONEPIECE_FILE = path.join(DATA_DIR, 'onepiece.json');

// Initialize card matcher and OCR recognizer
const cardMatcher = new CardMatcher();
const cardRecognizer = new CardNumberRecognizer();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readOnePieceCache() {
  try {
    if (fs.existsSync(ONEPIECE_FILE)) {
      const raw = fs.readFileSync(ONEPIECE_FILE, 'utf8');
      const json = JSON.parse(raw);
      if (Array.isArray(json)) return json;
    }
  } catch {}
  return [];
}

function writeOnePieceCache(items) {
  ensureDataDir();
  fs.writeFileSync(ONEPIECE_FILE, JSON.stringify(items, null, 2));
}

function mergePrices(items, priceMap) {
  const now = new Date().toISOString();
  return items.map(it => {
    const k = (it.card_code || '').toUpperCase();
    const price = priceMap[k];
    if (price != null) {
      return { ...it, price_eur: price, lastUpdated: now };
    }
    return it;
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Verify Cardmarket credentials by fetching games and resolving One Piece id
app.get('/api/verify-mkm', async (req, res) => {
  try {
    const hasCreds = process.env.MKM_APP_TOKEN && process.env.MKM_APP_SECRET && process.env.MKM_ACCESS_TOKEN && process.env.MKM_ACCESS_SECRET;
    if (!hasCreds) return res.status(400).json({ ok: false, error: 'Missing credentials' });
    const idGame = await ensureOnePieceGameId();
    res.json({ ok: true, idGame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Verification failed' });
  }
});

app.get('/api/stats', (req, res) => {
  const items = readOnePieceCache();
  const sumSearchableChars = items.reduce((acc, it) => {
    const txt = `${it.name || ''} ${it.card_code || ''} ${it.cm_expansion || ''}`;
    return acc + txt.replace(/\s/g, '').length;
  }, 0);
  const priced = items.filter(i => typeof i.price_eur === 'number').length;
  res.json({ count: items.length, sumSearchableChars, priced, lastUpdated: items[0]?.lastUpdated || null });
});

app.post('/api/refresh-onepiece', async (req, res) => {
  try {
    const hasCreds = process.env.MKM_APP_TOKEN && process.env.MKM_APP_SECRET && process.env.MKM_ACCESS_TOKEN && process.env.MKM_ACCESS_SECRET;
    if (!hasCreds) return res.status(400).json({ error: 'Missing Cardmarket credentials' });
    const idGame = await ensureOnePieceGameId();
    const seeds = ['OP01', 'OP02', 'OP03', 'OP04', 'OP05', 'OP06', 'OP07', 'OP08', 'ROMANCE', 'PARAMOUNT', 'Zoro', 'Luffy'];
    const map = new Map();
    for (const s of seeds) {
      const batch = await searchProducts(s, idGame);
      for (const b of batch) {
        map.set(`${b.cm_idProduct}`, b);
      }
      await new Promise(r => setTimeout(r, 300));
    }
    const items = Array.from(map.values());
    writeOnePieceCache(items);
    cardMatcher.refreshCards(); // Refresh the card matcher with new data
    res.json({ saved: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'refresh failed' });
  }
});

// Import One Piece dataset from uploaded JSON file (array of products)
app.post('/api/import-onepiece', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file' });
    const text = req.file.buffer.toString('utf8');
    const json = JSON.parse(text);
    if (!Array.isArray(json)) return res.status(400).json({ error: 'JSON must be an array' });
    const items = json.map(p => {
      const key = p.Key || p.key || p.card_code || p.number || '';
      const code = Array.isArray(p['CARD ID']) ? `${p['CARD ID'][0]}-${p['CARD ID'][1]}` : key;
      const set = p.Set || p.set || p.expansionName || '';
      const rarity = p.Rarity || p.rarity || '';
      const name = p['Card Name'] || p.name || p.enName || '';
      return {
        name,
        card_code: code,
        cm_expansion: set,
        cm_idProduct: key || code || name,
        cm_idExpansion: set,
        rarity,
      };
    }).filter(x => x.card_code || x.name);
    writeOnePieceCache(items);
    cardMatcher.refreshCards(); // Refresh the card matcher with new data
    res.json({ saved: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'import failed' });
  }
});

// Import One Piece dataset from a URL returning JSON array
app.post('/api/import-onepiece-url', async (req, res) => {
  try {
    const url = String(req.body?.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const r = await fetch(url);
    if (!r.ok) return res.status(400).json({ error: `Fetch failed ${r.status}` });
    const json = await r.json();
    if (!Array.isArray(json)) return res.status(400).json({ error: 'JSON must be an array' });
    const items = json.map(p => ({
      name: p.name || p.enName || '',
      card_code: p.card_code || p.number || '',
      cm_expansion: p.cm_expansion || p.expansionName || '',
      cm_idProduct: p.cm_idProduct || p.idProduct,
      cm_idExpansion: p.cm_idExpansion || p.idExpansion,
      rarity: p.rarity || '',
    })).filter(x => x.card_code || x.name);
    writeOnePieceCache(items);
    cardMatcher.refreshCards(); // Refresh the card matcher with new data
    res.json({ saved: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'import-url failed' });
  }
});

// Import from TCGCSV: expects CSV with product rows including set and number, price in EUR if present
app.post('/api/import-tcgcsv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file' });
    const { parse } = require('csv-parse/sync');
    const csv = req.file.buffer.toString('utf8');
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    const priceMap = {}; // key by normalized code
    const items = [];
    for (const r of records) {
      const name = r.ProductName || r.Name || r.name || '';
      const set = r.GroupName || r.Set || r.set || '';
      const number = r.Number || r.number || r.cardNumber || '';
      const rarity = r.Rarity || r.rarity || '';
      const eur = r['MarketPrice(EUR)'] || r.EUR || r.PriceEUR || '';
      const code = (number || '').toString().trim();
      const normCode = code.toUpperCase();
      if (name || code) {
        items.push({
          name,
          card_code: code,
          cm_expansion: set,
          cm_idProduct: `${set}:${code}:${name}`,
          cm_idExpansion: set,
          rarity,
        });
        if (eur && !isNaN(Number(eur))) priceMap[normCode] = Number(eur);
      }
    }
    const merged = mergePrices(items, priceMap);
    writeOnePieceCache(merged);
    cardMatcher.refreshCards(); // Refresh the card matcher with new data
    res.json({ saved: merged.length, priced: Object.keys(priceMap).length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'import-tcgcsv failed' });
  }
});

// Import from TCGCSV URL (CSV content)
app.post('/api/import-tcgcsv-url', async (req, res) => {
  try {
    const url = String(req.body?.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const r = await fetch(url);
    if (!r.ok) return res.status(400).json({ error: `Fetch failed ${r.status}` });
    const csv = await r.text();
    const { parse } = require('csv-parse/sync');
    const records = parse(csv, { columns: true, skip_empty_lines: true });
    const priceMap = {};
    const items = [];
    for (const r of records) {
      const name = r.ProductName || r.Name || r.name || '';
      const set = r.GroupName || r.Set || r.set || '';
      const number = r.Number || r.number || r.cardNumber || '';
      const rarity = r.Rarity || r.rarity || '';
      const eur = r['MarketPrice(EUR)'] || r.EUR || r.PriceEUR || '';
      const code = (number || '').toString().trim();
      const normCode = code.toUpperCase();
      if (name || code) {
        items.push({ name, card_code: code, cm_expansion: set, cm_idProduct: `${set}:${code}:${name}`, cm_idExpansion: set, rarity });
        if (eur && !isNaN(Number(eur))) priceMap[normCode] = Number(eur);
      }
    }
    const merged = mergePrices(items, priceMap);
    writeOnePieceCache(merged);
    cardMatcher.refreshCards(); // Refresh the card matcher with new data
    res.json({ saved: merged.length, priced: Object.keys(priceMap).length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'import-tcgcsv-url failed' });
  }
});

// Daily cron at 20:30 UTC: if TCGCSV source URL is configured, refresh
const TCGCSV_URL = process.env.TCGCSV_URL || '';
if (TCGCSV_URL) {
  cron.schedule('30 20 * * *', async () => {
    try {
      const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
      const r = await fetch(TCGCSV_URL);
      if (!r.ok) return;
      const csv = await r.text();
      const { parse } = require('csv-parse/sync');
      const records = parse(csv, { columns: true, skip_empty_lines: true });
      const priceMap = {};
      const items = [];
      for (const r of records) {
        const name = r.ProductName || r.Name || r.name || '';
        const set = r.GroupName || r.Set || r.set || '';
        const number = r.Number || r.number || r.cardNumber || '';
        const rarity = r.Rarity || r.rarity || '';
        const eur = r['MarketPrice(EUR)'] || r.EUR || r.PriceEUR || '';
        const code = (number || '').toString().trim();
        const normCode = code.toUpperCase();
        if (name || code) {
          items.push({ name, card_code: code, cm_expansion: set, cm_idProduct: `${set}:${code}:${name}`, cm_idExpansion: set, rarity });
          if (eur && !isNaN(Number(eur))) priceMap[normCode] = Number(eur);
        }
      }
      const merged = mergePrices(items, priceMap);
      writeOnePieceCache(merged);
      console.log(`[cron] TCGCSV refreshed: ${merged.length} items`);
    } catch (e) {
      console.error('[cron] refresh error', e);
    }
  }, { timezone: 'UTC' });
}

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const name = String(req.query.name || '').trim().toLowerCase();
    const code = String(req.query.code || '').trim().toLowerCase();
    const set = String(req.query.set || '').trim().toLowerCase();
    const rarity = String(req.query.rarity || '').trim().toLowerCase();
    const limit = Math.max(0, Math.min(100, parseInt(req.query.limit || '50', 10)));
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

    // Prefer cache
    const cached = readOnePieceCache();
    if (cached.length > 0) {
      const qn = q.toLowerCase();
      let hits = cached.filter(r => {
        const n = (r.name||'').toLowerCase();
        const c = (r.card_code||'').toLowerCase();
        const s = (r.cm_expansion||'').toLowerCase();
        const rr = (r.rarity||'').toLowerCase();
        const qOk = qn ? (n.includes(qn) || c.includes(qn) || s.includes(qn) || rr.includes(qn)) : true;
        const nameOk = name ? n.includes(name) : true;
        const codeOk = code ? c.includes(code) : true;
        const setOk = set ? s.includes(set) : true;
        const rarityOk = rarity ? rr.includes(rarity) : true;
        return qOk && nameOk && codeOk && setOk && rarityOk;
      });
      const total = hits.length;
      hits = hits.slice(offset, offset + limit);
      return res.json({ results: hits, total, source: 'cache' });
    }

    const hasCreds = process.env.MKM_APP_TOKEN && process.env.MKM_APP_SECRET && process.env.MKM_ACCESS_TOKEN && process.env.MKM_ACCESS_SECRET;
    if (!hasCreds) {
      let demo = [
        { name: 'Monkey.D.Luffy', card_code: 'OP01-001', cm_expansion: 'ROMANCE DAWN', cm_idProduct: 123456, cm_idExpansion: 111, rarity: 'LDR' },
        { name: 'Roronoa Zoro', card_code: 'OP01-025', cm_expansion: 'ROMANCE DAWN', cm_idProduct: 234567, cm_idExpansion: 111, rarity: 'SR' },
      ];
      demo = demo.filter(r => {
        const n = r.name.toLowerCase();
        const c = r.card_code.toLowerCase();
        const s = r.cm_expansion.toLowerCase();
        const rr = r.rarity.toLowerCase();
        const qn = q.toLowerCase();
        const qOk = q ? (n.includes(qn) || c.includes(qn) || s.includes(qn) || rr.includes(qn)) : true;
        const nameOk = name ? n.includes(name) : true;
        const codeOk = code ? c.includes(code) : true;
        const setOk = set ? s.includes(set) : true;
        const rarityOk = rarity ? rr.includes(rarity) : true;
        return qOk && nameOk && codeOk && setOk && rarityOk;
      });
      const total = demo.length;
      demo = demo.slice(offset, offset + limit);
      return res.json({ results: demo, total, source: 'demo' });
    }

    const idGame = await ensureOnePieceGameId();
    let results = await searchProducts(q || name || code || set || rarity, idGame);
    const nName = name, nCode = code, nSet = set, nRar = rarity;
    results = results.filter(r => {
      const n = (r.name||'').toLowerCase();
      const c = (r.card_code||'').toLowerCase();
      const s = (r.cm_expansion||'').toLowerCase();
      const rr = (r.rarity||'').toLowerCase();
      const nameOk = nName ? n.includes(nName) : true;
      const codeOk = nCode ? c.includes(nCode) : true;
      const setOk = nSet ? s.includes(nSet) : true;
      const rarityOk = nRar ? rr.includes(nRar) : true;
      return nameOk && codeOk && setOk && rarityOk;
    });
    const total = results.length;
    results = results.slice(offset, offset + limit);
    return res.json({ results, total, source: 'cardmarket' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/identify', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`Processing image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Extract text using OCR
    const ocrResult = await ocrService.extractText(req.file.buffer);
    console.log(`OCR extracted text: "${ocrResult.text}" (confidence: ${ocrResult.confidence})`);

    // Find the best matching card
    const matchedCard = cardMatcher.findBestMatch(ocrResult.text, 0.2); // Lower threshold for better matching

    if (matchedCard) {
      res.json({
        name: matchedCard.name,
        card_code: matchedCard.card_code,
        cm_expansion: matchedCard.cm_expansion,
        cm_idProduct: matchedCard.cm_idProduct,
        cm_idExpansion: matchedCard.cm_idExpansion,
        rarity: matchedCard.rarity,
        confidence: Math.min(ocrResult.confidence * matchedCard.matchScore, 0.99),
        raw_text: ocrResult.rawText,
        match_score: matchedCard.matchScore,
        extracted_code: matchedCard.extractedCode,
        extracted_name: matchedCard.extractedName
      });
    } else {
      // Return OCR result even if no card match found
      res.json({
        name: 'Unknown Card',
        card_code: '',
        cm_expansion: '',
        cm_idProduct: '',
        cm_idExpansion: '',
        rarity: '',
        confidence: ocrResult.confidence * 0.5, // Lower confidence for unmatched cards
        raw_text: ocrResult.rawText,
        match_score: 0,
        extracted_code: cardMatcher.extractCardCode(ocrResult.text),
        extracted_name: cardMatcher.extractCardName(ocrResult.text),
        error: 'No matching card found in database'
      });
    }
  } catch (error) {
    console.error('OCR identification failed:', error);
    res.status(500).json({
      error: 'OCR processing failed',
      details: error.message,
      name: 'Unknown',
      card_code: '',
      cm_expansion: '',
      cm_idProduct: '',
      cm_idExpansion: '',
      confidence: 0,
      raw_text: req.file?.originalname || 'Unknown file'
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
