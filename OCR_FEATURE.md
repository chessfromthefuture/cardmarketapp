# 📸 OCR Card Scanning Feature

## Overview
The Card Market App now includes Optical Character Recognition (OCR) functionality that allows you to scan photos of One Piece cards to automatically identify and match them to the correct card in the database.

## How It Works

### 1. **Image Processing**
- Upload a photo of a One Piece card
- The system uses Tesseract.js OCR to extract text from the image
- Images are automatically preprocessed for better accuracy (resizing, grayscale, sharpening)

### 2. **Text Extraction**
- Extracts card names, codes, and other text from the image
- Handles various formats like "OP01-001", "OP01001", "OP01 001"
- Cleans up OCR artifacts and normalizes text

### 3. **Smart Matching**
- Matches extracted text against the card database (11,784+ cards)
- Uses intelligent scoring based on:
  - Exact card code matches (highest priority)
  - Partial card code matches
  - Name similarity
  - Set/expansion matches
  - Rarity matches

### 4. **Results Display**
- Shows the best matching card with confidence score
- Displays extracted text, codes, and names
- Provides match score percentage
- Falls back gracefully if no match is found

## Usage Instructions

1. **Open the app**: Go to http://localhost:5173/
2. **Upload a card photo**: Click "Choose File" and select a clear photo of a One Piece card
3. **Click "Identify Card"**: The system will process the image and extract text
4. **Review results**: Check the detected card information and match confidence
5. **Edit if needed**: Modify any fields before saving to inventory
6. **Save to inventory**: Add the card to your collection

## Tips for Best Results

### 📷 **Photo Quality**
- Use clear, well-lit photos
- Ensure the card text is readable
- Avoid blurry or dark images
- Crop to focus on the card text area

### 🎯 **Card Positioning**
- Position the card straight (not rotated)
- Make sure card codes and names are visible
- Avoid shadows or reflections on the text

### 🔍 **Supported Formats**
- Card codes: OP01-001, OP01001, OP01 001, ST01-001, etc.
- Card names: Monkey.D.Luffy, Roronoa Zoro, etc.
- Set names: ROMANCE DAWN, PARAMOUNT WAR, etc.

## Technical Details

### **OCR Engine**: Tesseract.js v5.1.0
- Language: English
- Character whitelist: A-Z, 0-9, hyphens, spaces
- Optimized for card text recognition

### **Image Preprocessing**: Sharp
- Automatic resizing to 1200px width
- Grayscale conversion
- Image sharpening
- Normalization for better OCR accuracy

### **Matching Algorithm**
- Multi-factor scoring system
- Weighted by match type and confidence
- Minimum confidence threshold: 20%
- Fallback to partial matches when exact matches fail

## Troubleshooting

### **Low Match Scores**
- Try a clearer photo
- Ensure the card is straight and well-lit
- Check that card codes and names are visible

### **No Matches Found**
- Verify the card is in the database
- Try different photo angles
- Check if the card code format is supported

### **OCR Errors**
- Ensure the image file is valid (PNG, JPG, etc.)
- Check file size (should be under 10MB)
- Try a different image if the current one fails

## API Endpoints

- `POST /api/identify` - Upload and identify a card image
- `GET /api/stats` - View database statistics
- `POST /api/refresh-onepiece` - Refresh card database from Cardmarket

## Performance Notes

- First OCR request may take longer due to model initialization
- Subsequent requests are faster
- Processing time depends on image size and complexity
- Typical processing time: 2-5 seconds per image

---

**Ready to scan some cards?** Upload a photo and let the OCR magic begin! 🎴✨
