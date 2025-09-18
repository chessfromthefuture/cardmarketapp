// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Placeholder Cardmarket search by query (code or name)
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  // TODO: Replace with Cardmarket API call after OAuth wiring
  // Return structure expected by frontend
  const results = [
    { name: 'Monkey.D.Luffy', card_code: 'OP01-001', cm_expansion: 'ROMANCE DAWN', cm_idProduct: 123456, cm_idExpansion: 111, rarity: 'LDR' },
    { name: 'Roronoa Zoro', card_code: 'OP01-025', cm_expansion: 'ROMANCE DAWN', cm_idProduct: 234567, cm_idExpansion: 111, rarity: 'SR' },
  ].filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.card_code.toLowerCase().includes(q.toLowerCase()));
  res.json({ results });
});

// Placeholder identify endpoint (would accept image and call OCR + Cardmarket)
app.post('/api/identify', upload.single('file'), async (req, res) => {
  const filename = req.file?.originalname || '';
  res.json({ name: 'Unknown', card_code: '', cm_expansion: '', cm_idProduct: '', cm_idExpansion: '', confidence: 0.5, raw_text: filename });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
