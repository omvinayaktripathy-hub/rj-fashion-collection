const fs = require('fs');

console.log('Testing try-on simulation logic...');

let currentPreviewDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
let currentProduct = {
  id: 1,
  name: 'Boys Cotton Silk Kurta with Floral Nehru Waistcoat Set',
  image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  price: 1299
};

function simulateFallback(personUrl, productImg) {
  const simulatedData = {
    success: true,
    engine: 'RJ Atelier Neural Drape Simulator',
    processing_time_ms: 1900,
    result_url: personUrl,
    original_url: personUrl
  };
  return simulatedData;
}

const res = simulateFallback(currentPreviewDataUrl, currentProduct.image);
console.log('Simulated result:', res.success, res.engine);
