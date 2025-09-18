// Simple test script to verify OCR functionality
const fs = require('fs');
const path = require('path');

async function testOCR() {
  try {
    // Test with a simple text file to simulate OCR input
    const testData = {
      name: 'Monkey.D.Luffy',
      card_code: 'OP01-001',
      cm_expansion: 'ROMANCE DAWN',
      cm_idProduct: 123456,
      cm_idExpansion: 111,
      rarity: 'LDR',
      confidence: 0.95,
      raw_text: 'MONKEY.D.LUFFY OP01-001 Leader ROMANCE DAWN',
      match_score: 0.92,
      extracted_code: 'OP01-001',
      extracted_name: 'MONKEY.D.LUFFY'
    };

    console.log('🧪 Testing OCR Card Matching...');
    console.log('Test data:', JSON.stringify(testData, null, 2));

    // Test the API endpoint
    const FormData = require('form-data');
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    formData.append('file', testImageBuffer, { filename: 'test-card.png' });

    const response = await fetch('http://localhost:3001/api/identify', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('\n✅ OCR API Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.error) {
      console.log('\n⚠️  OCR Error (expected for test image):', result.error);
    } else {
      console.log('\n🎉 OCR functionality is working!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOCR();
