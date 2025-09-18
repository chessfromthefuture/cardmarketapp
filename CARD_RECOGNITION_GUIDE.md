# One Piece TCG Card Number Recognition Training Guide

## Overview
This guide provides a comprehensive approach to training a model for recognizing card numbers on One Piece TCG cards, specifically focusing on the card codes located in the bottom right corner.

## Card Number Format
One Piece TCG cards use the following format:
- **Main Sets**: `OP##-###` (e.g., OP01-001, OP02-121)
- **Starter Decks**: `ST##-###` (e.g., ST01-001, ST02-015)
- **Extra Boosters**: `EB##-###` (e.g., EB01-001)

## Data Sources

### 1. Official Sources
- **One Piece Card Game Official Website**: https://en.onepiece-cardgame.com/cardlist/
  - High-quality official images
  - Covers all expansions including OP12
  - Consistent image quality and format

### 2. Community Resources
- **SabaTCG Complete Gallery**: https://sabatcg.com/op01-op20-one-piece-card-gallery
  - Comprehensive collection from OP01-OP20
  - Well-organized by expansion sets
  - High-resolution images

- **OnePiece.gg**: https://onepiece.gg/cards/
  - Complete card database with images
  - Includes pricing and market data
  - Good for diverse card examples

- **One Piece Card Game Wiki**: https://one-piece-card-game.fandom.com/wiki/Category:Images
  - Community-contributed images
  - Additional card variations
  - Different lighting/angle examples

## Technical Implementation

### Phase 1: Data Collection
```bash
# Run the image scraper
node server/card-image-scraper.cjs

# This will create:
# - card_images/ directory structure
# - metadata.json with card information
# - ocr_training_guide.json with training instructions
```

### Phase 2: Image Preprocessing
1. **Crop Card Number Region**: Focus on bottom right corner (75% x, 85% y)
2. **Enhance Contrast**: Improve text visibility
3. **Grayscale Conversion**: Reduce noise and improve OCR accuracy
4. **Resize**: Standardize image dimensions

### Phase 3: OCR Model Training

#### Option A: Tesseract OCR
```bash
# Install Tesseract
brew install tesseract  # macOS
# or
sudo apt-get install tesseract-ocr  # Ubuntu

# Install Python dependencies
pip install pytesseract opencv-python pillow
```

#### Option B: EasyOCR (Recommended)
```bash
pip install easyocr
```

#### Option C: PaddleOCR (Best for Asian text)
```bash
pip install paddlepaddle paddleocr
```

### Phase 4: Model Integration

#### Python Implementation Example
```python
import easyocr
import cv2
import re

class CardNumberRecognizer:
    def __init__(self):
        self.reader = easyocr.Reader(['en'])
        self.card_pattern = re.compile(r'^(OP|ST|EB)(\d{2})-(\d{3})$')
    
    def extract_card_number(self, image_path):
        # Load and preprocess image
        image = cv2.imread(image_path)
        
        # Crop bottom right region (adjust coordinates as needed)
        height, width = image.shape[:2]
        x = int(width * 0.75)
        y = int(height * 0.85)
        w = int(width * 0.2)
        h = int(height * 0.1)
        
        cropped = image[y:y+h, x:x+w]
        
        # Run OCR
        results = self.reader.readtext(cropped)
        
        # Extract and validate card number
        for (bbox, text, confidence) in results:
            cleaned_text = re.sub(r'[^A-Z0-9-]', '', text.upper())
            if self.card_pattern.match(cleaned_text):
                return {
                    'card_code': cleaned_text,
                    'confidence': confidence,
                    'valid': True
                }
        
        return {'valid': False, 'error': 'No valid card number found'}
```

## Training Dataset Structure
```
card_images/
├── images/                 # Raw card images
├── labels/                 # YOLO format labels
├── cropped_numbers/        # Cropped card number regions
├── preprocessed/          # Preprocessed images for OCR
├── training_data.json     # Training metadata
└── validation_data.json   # Validation metadata
```

## Performance Metrics
- **Precision**: Percentage of correctly identified card numbers
- **Recall**: Percentage of actual card numbers found
- **F1-Score**: Harmonic mean of precision and recall
- **Character Accuracy**: Accuracy of individual character recognition

## Expected Results
Based on similar TCG card recognition projects:
- **Target Accuracy**: 95%+ for clear, high-resolution images
- **Processing Speed**: <1 second per image
- **Confidence Threshold**: 0.8+ for reliable matches

## Integration with Existing System

### JavaScript Integration
```javascript
// Add to your existing card matching system
const { CardNumberRecognizer } = require('./server/card-ocr.cjs');

const recognizer = new CardNumberRecognizer();

// Process uploaded image
async function processCardImage(imagePath) {
  const result = await recognizer.processImageForCardNumber(imagePath);
  
  if (result.success) {
    const cardMatch = recognizer.findCardByCode(result.cardCode);
    if (cardMatch.found) {
      return {
        success: true,
        card: cardMatch.card,
        confidence: result.confidence
      };
    }
  }
  
  return { success: false, error: 'Card not recognized' };
}
```

## Next Steps
1. **Collect Training Data**: Use the provided scraper to gather card images
2. **Preprocess Images**: Crop and enhance card number regions
3. **Train OCR Model**: Use your preferred OCR library
4. **Validate Results**: Test against known card codes
5. **Integrate System**: Connect to your existing card matching logic

## Troubleshooting

### Common Issues
- **Low OCR Accuracy**: Ensure images are high resolution and well-lit
- **Missing Card Numbers**: Check if card number region is properly cropped
- **Invalid Format**: Verify card number pattern matching logic

### Performance Optimization
- **Batch Processing**: Process multiple images simultaneously
- **Caching**: Cache OCR results for repeated images
- **GPU Acceleration**: Use GPU for faster processing when available

## Resources
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [OpenCV Python Tutorials](https://opencv-python-tutroals.readthedocs.io/)
