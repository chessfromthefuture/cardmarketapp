const { CardNumberRecognizer } = require('./card-ocr.cjs');
const { findOnePieceByCodeOrName } = require('../src/data/onepiece.js');

// Example usage of the card recognition system
async function demonstrateCardRecognition() {
  console.log('One Piece TCG Card Recognition Demo');
  console.log('===================================\n');

  const recognizer = new CardNumberRecognizer();

  // Test cases with various card codes
  const testCases = [
    'OP01-001',    // Valid main set card
    'ST01-002',    // Valid starter deck card
    'OP02-121',    // Valid main set card
    'EB01-001',    // Valid extra booster card
    'OP01 001',    // Valid with space
    'op01-001',    // Valid lowercase
    'OP1-1',       // Invalid format
    'invalid',     // Invalid
    'OP01-999',    // Valid format but might not exist
  ];

  console.log('Testing card number recognition:');
  console.log('--------------------------------');

  for (const testCode of testCases) {
    console.log(`\nTesting: "${testCode}"`);

    // Step 1: Extract and validate card number
    const extracted = recognizer.extractCardNumber(testCode);
    console.log(`  Extracted: ${extracted.fullCode}`);
    console.log(`  Valid: ${extracted.isValid ? '✓' : '✗'}`);

    if (extracted.isValid) {
      // Step 2: Find card in database
      const cardMatch = recognizer.findCardByCode(extracted.fullCode);

      if (cardMatch.found) {
        console.log(`  Found: ${cardMatch.card.name}`);
        console.log(`  Expansion: ${cardMatch.card.cm_expansion}`);
        console.log(`  Rarity: ${cardMatch.card.rarity}`);
      } else {
        console.log(`  Card not found in database`);
      }
    } else {
      console.log(`  Error: ${extracted.error}`);
    }
  }

  // Demonstrate batch processing
  console.log('\n\nBatch Processing Demo:');
  console.log('----------------------');

  const sampleImages = [
    'OP01-001.jpg',
    'ST01-002.png',
    'OP02-121.webp',
    'invalid-image.jpg'
  ];

  console.log('Processing sample images:');
  for (const image of sampleImages) {
    console.log(`\nProcessing: ${image}`);
    const result = await recognizer.processImageForCardNumber(image);

    if (result.success) {
      console.log(`  ✓ Recognized: ${result.cardCode}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      const cardMatch = recognizer.findCardByCode(result.cardCode);
      if (cardMatch.found) {
        console.log(`  Card: ${cardMatch.card.name}`);
      }
    } else {
      console.log(`  ✗ Failed: ${result.error || 'Unknown error'}`);
    }
  }

  // Generate training data example
  console.log('\n\nTraining Data Generation:');
  console.log('-------------------------');

  const trainingData = recognizer.generateTrainingData(sampleImages);
  console.log(`Generated training data for ${trainingData.annotations.length} images`);
  console.log('Sample annotation:');
  if (trainingData.annotations.length > 0) {
    console.log(JSON.stringify(trainingData.annotations[0], null, 2));
  }
}

// Integration example with existing card matching
function demonstrateIntegration() {
  console.log('\n\nIntegration with Existing System:');
  console.log('==================================');

  const recognizer = new CardNumberRecognizer();

  // Simulate processing an uploaded image
  function processUploadedCard(imagePath, filename) {
    console.log(`\nProcessing uploaded card: ${filename}`);

    // Extract card code from filename (common pattern)
    const cardCode = recognizer.extractCardNumber(filename);

    if (cardCode.isValid) {
      // Find card in database
      const cardMatch = recognizer.findCardByCode(cardCode.fullCode);

      if (cardMatch.found) {
        return {
          success: true,
          card: cardMatch.card,
          confidence: 0.95,
          method: 'filename_extraction'
        };
      } else {
        // Try OCR if filename extraction fails
        return {
          success: false,
          error: 'Card not found in database',
          suggestion: 'Try OCR processing'
        };
      }
    } else {
      return {
        success: false,
        error: 'Invalid card code format',
        suggestion: 'Check filename format (e.g., OP01-001.jpg)'
      };
    }
  }

  // Test with various filenames
  const testFiles = [
    'OP01-001.jpg',
    'Roronoa_Zoro_OP01-025.png',
    'invalid_format.jpg',
    'OP02-121_Edward_Newgate.webp'
  ];

  testFiles.forEach(filename => {
    const result = processUploadedCard(`/uploads/${filename}`, filename);
    console.log(`\nFile: ${filename}`);
    console.log(`Result: ${result.success ? '✓ Success' : '✗ Failed'}`);
    if (result.success) {
      console.log(`Card: ${result.card.name} (${result.card.card_code})`);
    } else {
      console.log(`Error: ${result.error}`);
      if (result.suggestion) {
        console.log(`Suggestion: ${result.suggestion}`);
      }
    }
  });
}

// Performance testing
function performanceTest() {
  console.log('\n\nPerformance Test:');
  console.log('=================');

  const recognizer = new CardNumberRecognizer();
  const iterations = 1000;

  console.log(`Testing ${iterations} card number extractions...`);

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const testCode = `OP${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 121) + 1).padStart(3, '0')}`;
    recognizer.extractCardNumber(testCode);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Completed ${iterations} extractions in ${duration}ms`);
  console.log(`Average time per extraction: ${(duration / iterations).toFixed(2)}ms`);
  console.log(`Throughput: ${Math.round(iterations / (duration / 1000))} extractions/second`);
}

// Main execution
if (require.main === module) {
  demonstrateCardRecognition()
    .then(() => {
      demonstrateIntegration();
      performanceTest();

      console.log('\n\nNext Steps:');
      console.log('===========');
      console.log('1. Run "npm run scrape:cards" to collect training images');
      console.log('2. Run "npm run test:ocr" to test OCR functionality');
      console.log('3. Integrate with your card upload system');
      console.log('4. Train OCR model with collected data for better accuracy');
    })
    .catch(error => {
      console.error('Demo failed:', error);
    });
}

module.exports = {
  demonstrateCardRecognition,
  demonstrateIntegration,
  performanceTest
};
