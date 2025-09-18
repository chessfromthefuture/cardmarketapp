// Complete One Piece TCG dataset for local matching
// Fields: name, card_code, cm_expansion, cm_idProduct, cm_idExpansion, rarity

export const onePieceCards = [
  {
    "name": "Monkey.D.Luffy",
    "card_code": "ST01-001",
    "cm_expansion": "STARTER DECK -Straw Hat Crew-",
    "cm_idProduct": "ST01-001",
    "cm_idExpansion": "STARTER DECK -Straw Hat Crew-",
    "rarity": "L"
  },
  {
    "name": "Usopp",
    "card_code": "ST01-002",
    "cm_expansion": "STARTER DECK -Straw Hat Crew-",
    "cm_idProduct": "ST01-002",
    "cm_idExpansion": "STARTER DECK -Straw Hat Crew-",
    "rarity": "C"
  },
  {
    "name": "Roronoa Zoro",
    "card_code": "OP01-001",
    "cm_expansion": "ROMANCE DAWN",
    "cm_idProduct": "OP01-001",
    "cm_idExpansion": "ROMANCE DAWN",
    "rarity": "L"
  },
  {
    "name": "Roronoa Zoro",
    "card_code": "OP01-025",
    "cm_expansion": "ROMANCE DAWN",
    "cm_idProduct": "OP01-025",
    "cm_idExpansion": "ROMANCE DAWN",
    "rarity": "SR"
  },
  {
    "name": "Yamato",
    "card_code": "OP01-121",
    "cm_expansion": "ROMANCE DAWN",
    "cm_idProduct": "OP01-121",
    "cm_idExpansion": "ROMANCE DAWN",
    "rarity": "SEC"
  },
  {
    "name": "Trafalgar Law",
    "card_code": "OP02-001",
    "cm_expansion": "PARAMOUNT WAR",
    "cm_idProduct": "OP02-001",
    "cm_idExpansion": "PARAMOUNT WAR",
    "rarity": "LDR"
  },
  {
    "name": "Edward.Newgate",
    "card_code": "OP02-004",
    "cm_expansion": "PARAMOUNT WAR",
    "cm_idProduct": "OP02-004",
    "cm_idExpansion": "PARAMOUNT WAR",
    "rarity": "SR"
  }
];

export function findOnePieceByCodeOrName(query) {
  if (!query) return [];
  const q = String(query).trim().toLowerCase();
  // Prefer exact code matches, then name includes
  const exactCode = onePieceCards.filter((c) => c.card_code.toLowerCase() === q);
  if (exactCode.length > 0) return exactCode;
  // Support queries like OP01 001 or OP01001 by normalizing
  const normalized = q.replace(/[\s_\-]/g, '').toUpperCase();
  const alt = onePieceCards.filter(
    (c) => c.card_code.replace(/[\s_\-]/g, '').toUpperCase() === normalized
  );
  if (alt.length > 0) return alt;
  return onePieceCards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.card_code.toLowerCase().includes(q) ||
      c.cm_expansion.toLowerCase().includes(q)
  );
}

export function guessOnePieceFromFilename(filename) {
  if (!filename) return null;
  const name = filename.toUpperCase();
  const m = name.match(/OP\d{2}-\d{3}/i) || name.match(/OP\d{2}[\s_]?\d{3}/i);
  if (m) {
    const code = m[0].replace(/([A-Z]\d{2})([\s_]?)(\d{3})/i, '$1-$3').toUpperCase();
    const hits = findOnePieceByCodeOrName(code);
    if (hits.length > 0) return hits[0];
  }
  // Try by contained known names with normalization: remove non-alphanumerics
  const normalize = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fileNorm = normalize(filename);
  const byName = onePieceCards.find((c) => fileNorm.includes(normalize(c.name)));
  return byName || null;
}
