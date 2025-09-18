const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.worker = await Tesseract.createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await this.worker.load();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');

      // Configure OCR for better card text recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./ ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      });

      this.isInitialized = true;
      console.log('OCR Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw error;
    }
  }

  async preprocessImage(buffer) {
    try {
      // Use Sharp to preprocess the image for better OCR
      const processedBuffer = await sharp(buffer)
        .resize(1200, null, {
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3
        })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return buffer; // Return original if preprocessing fails
    }
  }

  async extractText(imageBuffer) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const processedImage = await this.preprocessImage(imageBuffer);

      const { data: { text, confidence } } = await this.worker.recognize(processedImage);

      return {
        text: text.trim(),
        confidence: confidence / 100, // Convert to 0-1 scale
        rawText: text
      };
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      throw error;
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
const ocrService = new OCRService();

module.exports = { OCRService, ocrService };
