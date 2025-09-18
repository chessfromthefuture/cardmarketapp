const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  outputDir: './card_images',
  maxConcurrent: 5,
  delayBetweenRequests: 1000, // 1 second delay
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Create output directory
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Utility function to download images
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filename);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded: ${filename}`);
          resolve(filename);
        });
        fileStream.on('error', reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

// Simulate official One Piece Card Game website scraping
// Note: This is a template - actual implementation would need to handle dynamic content
async function scrapeOfficialWebsite() {
  console.log('Scraping Official One Piece Card Game Website...');

  // This would need to be implemented with actual scraping logic
  // For now, we'll create a template structure
  const expansions = [
    'OP01', 'OP02', 'OP03', 'OP04', 'OP05',
    'OP06', 'OP07', 'OP08', 'OP09', 'OP10', 'OP11', 'OP12'
  ];

  const results = [];

  for (const expansion of expansions) {
    console.log(`Processing ${expansion}...`);
    // In a real implementation, you would:
    // 1. Navigate to the card list page for each expansion
    // 2. Extract card image URLs and card codes
    // 3. Download images with proper naming

    // Placeholder for actual scraping logic
    results.push({
      expansion,
      cards: [],
      status: 'placeholder'
    });
  }

  return results;
}

// Generate sample card URLs for testing
function generateSampleCardUrls() {
  const sampleCards = [
    { code: 'OP01-001', name: 'Monkey.D.Luffy', expansion: 'OP01' },
    { code: 'OP01-025', name: 'Roronoa Zoro', expansion: 'OP01' },
    { code: 'OP01-121', name: 'Yamato', expansion: 'OP01' },
    { code: 'OP02-001', name: 'Trafalgar Law', expansion: 'OP02' },
    { code: 'OP02-004', name: 'Edward.Newgate', expansion: 'OP02' },
    { code: 'ST01-001', name: 'Monkey.D.Luffy', expansion: 'ST01' },
    { code: 'ST01-002', name: 'Usopp', expansion: 'ST01' }
  ];

  return sampleCards.map(card => ({
    ...card,
    imageUrl: `https://example.com/cards/${card.code}.jpg`, // Placeholder URL
    localPath: path.join(CONFIG.outputDir, `${card.code}.jpg`)
  }));
}

// Main scraping function
async function scrapeCardImages() {
  console.log('Starting One Piece TCG Card Image Scraping...');
  console.log(`Output directory: ${CONFIG.outputDir}`);

  try {
    // For demonstration, we'll create a sample structure
    const sampleCards = generateSampleCardUrls();

    console.log(`Found ${sampleCards.length} sample cards to process`);

    // Create expansion directories
    const expansions = [...new Set(sampleCards.map(card => card.expansion))];
    for (const expansion of expansions) {
      const expDir = path.join(CONFIG.outputDir, expansion);
      if (!fs.existsSync(expDir)) {
        fs.mkdirSync(expDir, { recursive: true });
      }
    }

    // Create metadata file
    const metadata = {
      scrapedAt: new Date().toISOString(),
      totalCards: sampleCards.length,
      expansions: expansions,
      cards: sampleCards.map(card => ({
        code: card.code,
        name: card.name,
        expansion: card.expansion,
        imageUrl: card.imageUrl,
        localPath: card.localPath
      }))
    };

    fs.writeFileSync(
      path.join(CONFIG.outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('Metadata saved to metadata.json');
    console.log('Note: This is a template. Actual image URLs need to be scraped from the websites.');

    return metadata;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
}

// OCR Training Data Preparation
function prepareOCRTrainingData(metadata) {
  console.log('Preparing OCR training data...');

  const trainingData = {
    cardNumberFormat: 'OP##-### or ST##-###',
    cardNumberLocation: 'Bottom right corner',
    expectedFormats: [
      'OP01-001', 'OP02-025', 'OP03-121',
      'ST01-001', 'ST02-015', 'EB01-001'
    ],
    imageRequirements: {
      minResolution: '800x600',
      cardNumberVisibility: 'Clear and readable',
      backgroundContrast: 'High contrast for OCR'
    },
    trainingSteps: [
      '1. Collect high-resolution card images',
      '2. Crop card number region (bottom right)',
      '3. Preprocess images (grayscale, contrast enhancement)',
      '4. Train OCR model on card number patterns',
      '5. Validate against known card codes'
    ]
  };

  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'ocr_training_guide.json'),
    JSON.stringify(trainingData, null, 2)
  );

  console.log('OCR training guide created');
  return trainingData;
}

// Main execution
if (require.main === module) {
  scrapeCardImages()
    .then(metadata => {
      console.log('Scraping completed successfully!');
      return prepareOCRTrainingData(metadata);
    })
    .then(() => {
      console.log('OCR training data preparation completed!');
      console.log('\nNext steps:');
      console.log('1. Implement actual web scraping for the identified sources');
      console.log('2. Download high-resolution card images');
      console.log('3. Crop card number regions from images');
      console.log('4. Train OCR model using the collected data');
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = {
  scrapeCardImages,
  prepareOCRTrainingData,
  downloadImage,
  CONFIG
};
