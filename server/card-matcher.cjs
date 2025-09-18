const fs = require('fs');
const path = require('path');

class CardMatcher {
  constructor() {
    this.cards = [];
    this.loadCards();
  }

  loadCards() {
    try {
      const dataPath = path.join(__dirname, '..', 'data_cache', 'onepiece.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        this.cards = JSON.parse(raw);
        console.log(`Loaded ${this.cards.length} cards for matching`);
      } else {
        console.log('No card data found, using fallback data');
        this.cards = this.getFallbackCards();
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
      this.cards = this.getFallbackCards();
    }
  }

  getFallbackCards() {
    return [
      {
        name: "Monkey.D.Luffy",
        card_code: "OP01-001",
        cm_expansion: "ROMANCE DAWN",
        cm_idProduct: 123456,
        cm_idExpansion: 111,
        rarity: "LDR"
      },
      {
        name: "Roronoa Zoro",
        card_code: "OP01-025",
        cm_expansion: "ROMANCE DAWN",
        cm_idProduct: 234567,
        cm_idExpansion: 111,
        rarity: "SR"
      },
      {
        name: "Trafalgar Law",
        card_code: "OP02-001",
        cm_expansion: "PARAMOUNT WAR",
        cm_idProduct: 345678,
        cm_idExpansion: 222,
        rarity: "LDR"
      }
    ];
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  extractCardCode(text) {
    // Look for patterns like OP01-001, OP01001, OP01 001, etc.
    const patterns = [
      /OP\d{2}[-_\s]?\d{3}/gi,
      /ST\d{2}[-_\s]?\d{3}/gi,
      /P\d{3}/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Normalize the code format
        let code = match[0].toUpperCase();
        code = code.replace(/[-_\s]/g, '-');

        // Handle cases like OP01001 -> OP01-001
        if (code.match(/^OP\d{4}$/)) {
          code = code.replace(/^(OP\d{2})(\d{3})$/, '$1-$2');
        }

        return code;
      }
    }
    return null;
  }

  extractCardName(text) {
    // Remove common OCR artifacts and clean up the text
    let cleaned = text
      .replace(/\b(LEADER|CHARACTER|EVENT|STAGE|DON|DON!!)\b/gi, '') // Remove card types
      .replace(/\b(COST|POWER|COUNTER|LIFE|ATTRIBUTE)\b/gi, '') // Remove stats
      .replace(/\b\d+\b/g, '') // Remove standalone numbers
      .replace(/\b(OP|ST|P)\d{2}[-_\s]?\d{3}\b/gi, '') // Remove card codes
      .replace(/\b(ROMANCE|DAWN|PARAMOUNT|WAR|STARTER|DECK)\b/gi, '') // Remove set names
      .replace(/[^\w\s.-]/g, ' ') // Keep only word chars, spaces, dots, hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split by common separators and take the longest meaningful part
    const parts = cleaned.split(/[.\-_]/).map(p => p.trim()).filter(p => p.length > 2);

    if (parts.length === 0) return null;

    // Return the longest part that looks like a name
    return parts.reduce((longest, part) => part.length > longest.length ? part : longest);
  }

  calculateMatchScore(ocrText, card) {
    const normalizedOcr = this.normalizeText(ocrText);
    const normalizedCardName = this.normalizeText(card.name || '');
    const normalizedCardCode = this.normalizeText(card.card_code || '');
    const normalizedExpansion = this.normalizeText(card.cm_expansion || '');

    let score = 0;
    let maxScore = 0;

    // Check for exact card code match (highest priority)
    const extractedCode = this.extractCardCode(ocrText);
    if (extractedCode && extractedCode === card.card_code) {
      score += 100;
      maxScore += 100;
    }

    // Check for partial card code match
    if (extractedCode && card.card_code && card.card_code.includes(extractedCode.replace(/[-_\s]/g, ''))) {
      score += 50;
      maxScore += 50;
    }

    // Check for name matches
    if (normalizedCardName && normalizedOcr.includes(normalizedCardName)) {
      score += 40;
      maxScore += 40;
    } else if (normalizedCardName) {
      // Partial name match
      const nameWords = normalizedCardName.split(' ');
      const matchedWords = nameWords.filter(word =>
        word.length > 2 && normalizedOcr.includes(word)
      );
      if (matchedWords.length > 0) {
        score += (matchedWords.length / nameWords.length) * 30;
        maxScore += 30;
      }
    }

    // Check for expansion/set match
    if (normalizedExpansion && normalizedOcr.includes(normalizedExpansion)) {
      score += 20;
      maxScore += 20;
    }

    // Check for rarity match
    if (card.rarity && normalizedOcr.includes(card.rarity.toLowerCase())) {
      score += 10;
      maxScore += 10;
    }

    return maxScore > 0 ? (score / maxScore) : 0;
  }

  findBestMatch(ocrText, minConfidence = 0.3) {
    if (!ocrText || ocrText.trim().length === 0) {
      return null;
    }

    console.log(`Searching for match in OCR text: "${ocrText}"`);

    let bestMatch = null;
    let bestScore = 0;

    for (const card of this.cards) {
      const score = this.calculateMatchScore(ocrText, card);

      if (score > bestScore && score >= minConfidence) {
        bestScore = score;
        bestMatch = {
          ...card,
          matchScore: score,
          extractedCode: this.extractCardCode(ocrText),
          extractedName: this.extractCardName(ocrText)
        };
      }
    }

    if (bestMatch) {
      console.log(`Best match found: ${bestMatch.name} (${bestMatch.card_code}) with score ${bestScore.toFixed(2)}`);
    } else {
      console.log('No suitable match found');
    }

    return bestMatch;
  }

  // Method to refresh card data
  refreshCards() {
    this.loadCards();
  }
}

module.exports = { CardMatcher };
