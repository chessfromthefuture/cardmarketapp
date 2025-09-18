const fs = require('fs');
const path = require('path');

// OCR Configuration
const OCR_CONFIG = {
  cardNumberPattern: /^(OP|ST|EB)(\d{2})-(\d{3})$/i,
  cardNumberLocation: {
    // Bottom right corner coordinates (normalized 0-1)
    x: 0.75, // 75% from left
    y: 0.85, // 85% from top
    width: 0.2, // 20% width
    height: 0.1  // 10% height
  },
  preprocessing: {
    grayscale: true,
    contrastEnhancement: true,
    noiseReduction: true
  }
};

// Card number recognition using pattern matching
class CardNumberRecognizer {
  constructor() {
    this.cardDatabase = this.loadCardDatabase();
  }

  loadCardDatabase() {
    try {
      const cardData = require('../src/data/onepiece.js');
      return cardData.onePieceCards || [];
    } catch (error) {
      console.warn('Could not load card database:', error.message);
      return [];
    }
  }

  // Extract card number from image filename or text
  extractCardNumber(input) {
    if (!input) return null;
    
    // Try direct pattern matching first
    const match = input.match(OCR_CONFIG.cardNumberPattern);
    if (match) {
      return {
        fullCode: match[0].toUpperCase(),
        setCode: match[1].toUpperCase(),
        setNumber: match[2],
        cardNumber: match[3],
        isValid: true
      };
    }
    
    // Try to clean and normalize the input
    const cleaned = input.toString().toUpperCase()
      .replace(/[^A-Z0-9-]/g, '') // Remove non-alphanumeric except hyphens
      .replace(/\s+/g, ''); // Remove spaces
    
    const cleanedMatch = cleaned.match(OCR_CONFIG.cardNumberPattern);
    if (cleanedMatch) {
      return {
        fullCode: cleanedMatch[0],
        setCode: cleanedMatch[1],
        setNumber: cleanedMatch[2],
        cardNumber: cleanedMatch[3],
        isValid: true
      };
    }
    
    return {
      fullCode: input,
      isValid: false,
      error: 'Invalid card number format'
    };
  }

  // Find card by code in database
  findCardByCode(cardCode) {
    const extracted = this.extractCardNumber(cardCode);
    if (!extracted.isValid) {
      return { found: false, error: extracted.error };
    }

    const card = this.cardDatabase.find(c => 
      c.card_code.toUpperCase() === extracted.fullCode
    );

    return {
      found: !!card,
      card: card || null,
      extractedCode: extracted
    };
  }

  // Simulate OCR processing of an image
  // In a real implementation, this would use actual OCR libraries like Tesseract
  async processImageForCardNumber(imagePath) {
    console.log(`Processing image: ${imagePath}`);
    
    // Simulate image processing steps
    const steps = [
      'Loading image...',
      'Detecting card boundaries...',
      'Cropping card number region...',
      'Preprocessing for OCR...',
      'Running OCR recognition...',
      'Validating card number format...'
    ];
    
    for (const step of steps) {
      console.log(`  ${step}`);
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Extract card code from filename as fallback
    const filename = path.basename(imagePath, path.extname(imagePath));
    const cardCode = this.extractCardNumber(filename);
    
    return {
      success: cardCode.isValid,
      cardCode: cardCode.fullCode,
      confidence: cardCode.isValid ? 0.95 : 0.0,
      extracted: cardCode,
      imagePath: imagePath
    };
  }

  // Batch process multiple images
  async processBatch(images) {
    console.log(`Processing ${images.length} images...`);
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`\nProcessing ${i + 1}/${images.length}: ${image}`);
      
      try {
        const result = await this.processImageForCardNumber(image);
        results.push(result);
        
        if (result.success) {
          const cardMatch = this.findCardByCode(result.cardCode);
          if (cardMatch.found) {
            console.log(`  ✓ Found card: ${cardMatch.card.name} (${result.cardCode})`);
          } else {
            console.log(`  ⚠ Card code recognized but not found in database: ${result.cardCode}`);
          }
        } else {
          console.log(`  ✗ Failed to recognize card number`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${image}:`, error.message);
        results.push({
          success: false,
          error: error.message,
          imagePath: image
        });
      }
    }
    
    return results;
  }

  // Generate training data format for machine learning
  generateTrainingData(images) {
    const trainingData = {
      format: 'YOLO',
      classes: ['card_number'],
      annotations: []
    };
    
    images.forEach((image, index) => {
      const cardCode = this.extractCardNumber(path.basename(image, path.extname(image)));
      
      if (cardCode.isValid) {
        trainingData.annotations.push({
          image: image,
          card_code: cardCode.fullCode,
          bbox: {
            x: OCR_CONFIG.cardNumberLocation.x,
            y: OCR_CONFIG.cardNumberLocation.y,
            width: OCR_CONFIG.cardNumberLocation.width,
            height: OCR_CONFIG.cardNumberLocation.height
          },
          text: cardCode.fullCode
        });
      }
    });
    
    return trainingData;
  }

  // Validate card number format
  validateCardNumber(cardNumber) {
    const extracted = this.extractCardNumber(cardNumber);
    return {
      isValid: extracted.isValid,
      formatted: extracted.isValid ? extracted.fullCode : null,
      error: extracted.error || null
    };
  }
}

// Training data preparation utilities
class TrainingDataPreparer {
  constructor() {
    this.recognizer = new CardNumberRecognizer();
  }

  // Create training dataset structure
  createTrainingStructure(outputDir) {
    const structure = {
      'images/': 'Raw card images',
      'labels/': 'YOLO format labels',
      'cropped_numbers/': 'Cropped card number regions',
      'preprocessed/': 'Preprocessed images for OCR',
      'training_data.json': 'Training metadata',
      'validation_data.json': 'Validation metadata'
    };

    Object.keys(structure).forEach(dir => {
      const fullPath = path.join(outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
      }
    });

    return structure;
  }

  // Generate training instructions
  generateTrainingInstructions() {
    const instructions = {
      title: 'One Piece TCG Card Number Recognition Training',
      steps: [
        {
          step: 1,
          title: 'Data Collection',
          description: 'Collect high-resolution card images from official sources',
          sources: [
            'en.onepiece-cardgame.com/cardlist/',
            'sabatcg.com/op01-op20-one-piece-card-gallery',
            'onepiece.gg/cards/'
          ]
        },
        {
          step: 2,
          title: 'Image Preprocessing',
          description: 'Crop card number regions and enhance for OCR',
          tools: ['OpenCV', 'PIL/Pillow', 'ImageMagick']
        },
        {
          step: 3,
          title: 'OCR Model Training',
          description: 'Train OCR model on card number patterns',
          options: [
            'Tesseract OCR with custom training',
            'EasyOCR for better accuracy',
            'PaddleOCR for Chinese/Japanese text',
            'Custom CNN for card-specific patterns'
          ]
        },
        {
          step: 4,
          title: 'Validation and Testing',
          description: 'Test model accuracy against known card codes',
          metrics: ['Precision', 'Recall', 'F1-Score', 'Character Accuracy']
        }
      ],
      technicalRequirements: {
        libraries: ['opencv-python', 'pytesseract', 'easyocr', 'paddleocr'],
        hardware: 'GPU recommended for training',
        datasetSize: 'Minimum 1000+ card images recommended'
      }
    };

    return instructions;
  }
}

// Main execution
if (require.main === module) {
  const recognizer = new CardNumberRecognizer();
  const preparer = new TrainingDataPreparer();
  
  console.log('One Piece TCG Card Number Recognition System');
  console.log('============================================\n');
  
  // Test card number recognition
  const testCodes = ['OP01-001', 'ST01-002', 'OP02-121', 'invalid-code', 'OP01 001'];
  
  console.log('Testing card number recognition:');
  testCodes.forEach(code => {
    const result = recognizer.validateCardNumber(code);
    console.log(`  ${code} -> ${result.isValid ? '✓' : '✗'} ${result.formatted || result.error}`);
  });
  
  console.log('\nGenerating training instructions...');
  const instructions = preparer.generateTrainingInstructions();
  
  fs.writeFileSync(
    path.join(__dirname, 'ocr_training_instructions.json'),
    JSON.stringify(instructions, null, 2)
  );
  
  console.log('Training instructions saved to ocr_training_instructions.json');
  console.log('\nNext steps:');
  console.log('1. Run the image scraper to collect card images');
  console.log('2. Use the training data preparer to structure your dataset');
  console.log('3. Train an OCR model using the collected data');
  console.log('4. Integrate the trained model into your card matching system');
}

module.exports = {
  CardNumberRecognizer,
  TrainingDataPreparer,
  OCR_CONFIG
};
