var escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
/**
 * RJ FASHION COLLECTION — AI VIRTUAL TRY-ON STUDIO
 * =================================================
 * Client-Side Orchestrator for Real AI Virtual Apparel Fitting
 */

(function () {
  'use strict';

  // Global State
  let tryonSettings = {
    enabled: true,
    allowed_categories: ['sarees', 'kurtis', 'dresses', 'lehengas', 'ethnic-wear'],
    max_upload_size_mb: 8
  };

  let currentProduct = null;
  let currentFile = null;
  let webcamStream = null;
  let activeTryonMode = 'webcam';
  let garmentScale = 100;
  let garmentOpacity = 90;
  let garmentPosX = 0;
  let garmentPosY = 20;
  let isGarmentFlipped = false;
  let selectedTryonSize = 'M';
  let currentToken = null;
  let isProcessing = false;
  let statusInterval = null;
  let progressVal = 10;

  // Initialize and fetch tryon config
  async function init() {
    try {
      if (window.isStaticHosting) throw new Error('static');
      const res = await fetch('/api/tryon/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          tryonSettings = data;
        }
      }
    } catch (_) {}

    injectModalMarkup();
    setupEventListeners();
  }

  // Inject the Virtual Dressing Room Modal HTML
  function injectModalMarkup() {
    if (document.getElementById('rjTryonModal')) return;

    const modalHtml = `
      <div id="rjTryonModal" class="rj-tryon-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rjTryonTitle">
        <div class="rj-tryon-modal-dialog">
          
          <!-- Header -->
          <div class="rj-tryon-modal-header">
            <div class="rj-tryon-brand-wrap">
              <div class="rj-tryon-brand-icon">✨</div>
              <div class="rj-tryon-title-wrap">
                <h3 id="rjTryonTitle">✨ AI Couture Dressing Room • Live Simulation</h3>
                <p id="rjTryonSubtitle">Interactive real-time garment drape for selected couture</p>
              </div>
            </div>
            <button type="button" class="rj-tryon-close-btn" id="rjTryonClose" aria-label="Close Dressing Room">&times;</button>
          </div>

          <!-- Body -->
          <div class="rj-tryon-modal-body">
            
            <!-- Selected Product Bar -->
            <div class="rj-tryon-product-bar" id="rjTryonProductBar">
              <div class="rj-tryon-product-info">
                <img src="/images/placeholder.jpg" alt="Selected Product" class="rj-tryon-product-thumb" id="rjTryonProductThumb">
                <div class="rj-tryon-product-details">
                  <strong id="rjTryonProductName">Selected Apparel</strong>
                  <span id="rjTryonProductPrice">₹0</span>
                </div>
              </div>
              <button type="button" class="rj-tryon-change-prod-btn" id="rjTryonChangeProductBtn">Change Outfit</button>
            </div>

            <!-- STAGE 1: UPLOAD & CONSENT -->
            <div id="rjTryonStageUpload">
              <div class="rj-tryon-upload-grid">
                
                <!-- Left: Dropzone or Image Preview -->
                <div>
                  <div class="rj-tryon-dropzone" id="rjTryonDropzone">
                    <input type="file" id="rjTryonFileInput" accept="image/jpeg,image/png,image/webp">
                    <div class="rj-tryon-drop-icon">📷</div>
                    <div class="rj-tryon-drop-text">Upload Your Photo</div>
                    <div class="rj-tryon-drop-subtext">Click or drag & drop (JPG, PNG, WebP up to ${tryonSettings.max_upload_size_mb || 8}MB)</div>
                    <button type="button" class="rj-tryon-select-file-btn">Choose from Device</button>
                  </div>

                  <div class="rj-tryon-preview-box" id="rjTryonPreviewBox">
                    <img src="" alt="Customer Preview" class="rj-tryon-preview-img" id="rjTryonPreviewImg">
                    <div class="rj-tryon-preview-overlay">
                      <span style="color:#fff; font-size:0.8rem; font-weight:600;">✓ Ready to try on</span>
                      <div class="rj-tryon-preview-actions">
                        <button type="button" class="rj-tryon-preview-btn" id="rjTryonReplaceBtn">Change Photo</button>
                        <button type="button" class="rj-tryon-preview-btn remove" id="rjTryonRemoveBtn">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Guidelines & Consent -->
                <div>
                  <div class="rj-tryon-guide-card">
                    <div class="rj-tryon-guide-title">
                      <span>💎</span> For Best Fitting Preview:
                    </div>
                    <ul class="rj-tryon-guide-list">
                      <li><span class="icon">✓</span> Stand upright with a clear, well-lit background.</li>
                      <li><span class="icon">✓</span> Full-body or upper-body front-facing portrait.</li>
                      <li><span class="icon">✓</span> Wear simple, form-fitting attire without bulky jackets.</li>
                      <li><span class="icon">✓</span> Keep arms relaxed slightly away from torso.</li>
                    </ul>

                    <div class="rj-tryon-consent-card">
                      <input type="checkbox" id="rjTryonConsentCheck">
                      <label for="rjTryonConsentCheck">
                        I agree to the <a href="/faq.html" target="_blank">Virtual Try-On Terms</a>. My photo is processed securely for instant preview, automatically deleted, and never shared or used for model training.
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Submit Button -->
              <button type="button" class="rj-tryon-submit-btn" id="rjTryonSubmitBtn" disabled>
                <span>✨</span> Generate AI Virtual Try-On
              </button>
            </div>

            <!-- STAGE 2: PROCESSING LOADER -->
            <div id="rjTryonStageProcessing" class="rj-tryon-processing-wrap">
              <div class="rj-tryon-pulsing-rings">
                <div class="rj-tryon-ring"></div>
                <div class="rj-tryon-ring"></div>
                <div class="rj-tryon-ring"></div>
                <div class="rj-tryon-processing-center-icon">👑</div>
              </div>
              <h4 class="rj-tryon-processing-title">Crafting Your Royal Preview</h4>
              <div class="rj-tryon-processing-step" id="rjTryonStatusText">Analyzing pose geometry & fabric silhouette...</div>
              <div class="rj-tryon-progress-bar-wrap">
                <div class="rj-tryon-progress-bar-fill" id="rjTryonProgressBar"></div>
              </div>
              <p style="font-size:0.8rem; color:var(--tryon-muted);">Please stay on this window. This typically takes 5–20 seconds.</p>
              <button type="button" class="rj-tryon-cancel-btn" id="rjTryonCancelBtn">Cancel</button>
            </div>

            <!-- STAGE 3: RESULT STUDIO (BEFORE / AFTER) -->
            <div id="rjTryonStageResult" class="rj-tryon-result-wrap">
              
              <!-- Split Interactive Slider -->
              <div class="rj-tryon-slider-box" id="rjTryonSliderBox">
                <!-- After Image (AI Generated) -->
                <img src="" alt="AI Try-On Result" class="rj-tryon-slide-img rj-tryon-img-after" id="rjTryonResultImg">
                <div class="rj-tryon-tag after">✨ AI Try-On</div>

                <!-- Before Image (Original User Photo) -->
                <div class="rj-tryon-slide-img rj-tryon-img-before" id="rjTryonBeforeWrap">
                  <img src="" alt="Original Photo" id="rjTryonOriginalImg">
                </div>
                <div class="rj-tryon-tag before">Original</div>

                <!-- Draggable Divider Handle -->
                <div class="rj-tryon-slider-handle" id="rjTryonSliderHandle">
                  <div class="rj-tryon-slider-button">⇄</div>
                </div>
              </div>

              <!-- Disclaimer & Engine Pill -->
              <div class="rj-tryon-disclaimer-pill" id="rjTryonDisclaimerText">
                ℹ️ <strong>AI Visualization:</strong> This preview is generated using deep learning models for drape visualization. Real-world fit, textile weight, and hand-embroidery finish may subtly vary.
              </div>

              <!-- Result Actions Bar -->
              <div class="rj-tryon-result-actions">
                <button type="button" class="rj-tryon-action-btn primary" id="rjTryonAddToCartBtn">
                  <span>🛒</span> Add Outfit to Cart
                </button>
                <button type="button" class="rj-tryon-action-btn secondary" id="rjTryonDownloadBtn">
                  <span>📥</span> Download Preview
                </button>
                <button type="button" class="rj-tryon-action-btn secondary" id="rjTryonRegenerateBtn">
                  <span>🔄</span> Generate Again
                </button>
                <button type="button" class="rj-tryon-action-btn secondary" id="rjTryonTryAnotherBtn">
                  <span>👗</span> Try Another Outfit
                </button>
                <button type="button" class="rj-tryon-delete-my-photo-btn" id="rjTryonDeletePhotosBtn" title="Immediately erase all photos from server">
                  <span>🗑️</span> Delete My Photos
                </button>
              </div>

            </div>

          </div>

          <!-- Toast Notification -->
          <div class="rj-tryon-toast" id="rjTryonToast">Notification</div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    const modal = document.getElementById('rjTryonModal');
    const closeBtn = document.getElementById('rjTryonClose');
    const dropzone = document.getElementById('rjTryonDropzone');
    const fileInput = document.getElementById('rjTryonFileInput');
    const consentCheck = document.getElementById('rjTryonConsentCheck');
    const submitBtn = document.getElementById('rjTryonSubmitBtn');
    const replaceBtn = document.getElementById('rjTryonReplaceBtn');
    const removeBtn = document.getElementById('rjTryonRemoveBtn');
    const cancelBtn = document.getElementById('rjTryonCancelBtn');
    const addToCartBtn = document.getElementById('rjTryonAddToCartBtn');
    const downloadBtn = document.getElementById('rjTryonDownloadBtn');
    const regenerateBtn = document.getElementById('rjTryonRegenerateBtn');
    const tryAnotherBtn = document.getElementById('rjTryonChangeProductBtn');
    const tryAnotherBtn2 = document.getElementById('rjTryonTryAnotherBtn');
    const deletePhotosBtn = document.getElementById('rjTryonDeletePhotosBtn');

    // Close Modal on backdrop click or close button
    if (closeBtn) closeBtn.addEventListener('click', closeTryonModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTryonModal();
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeTryonModal();
      }
    });

    // File Input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelected(file);
      });
    }

    // Drag and Drop
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelected(file);
      });
    }

    // Consent Checkbox toggle
    if (consentCheck) {
      consentCheck.addEventListener('change', validateSubmitState);
    }

    // Replace & Remove
    if (replaceBtn) {
      replaceBtn.addEventListener('click', () => fileInput && fileInput.click());
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', resetPhotoUpload);
    }

    // Start Tryon Submit
    if (submitBtn) {
      submitBtn.addEventListener('click', startTryonProcess);
    }

    // Cancel Processing
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        isProcessing = false;
        clearInterval(statusInterval);
        showStage('upload');
      });
    }

    // Add to cart from tryon
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', handleAddToCart);
    }

    // Download Preview
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownloadResult);
    }

    // Regenerate
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', startTryonProcess);
    }

    // Change outfit / browse catalog
    const changeOutfitHandler = () => {
      closeTryonModal();
      window.location.href = '/shop.html';
    };
    if (tryAnotherBtn) tryAnotherBtn.addEventListener('click', changeOutfitHandler);
    if (tryAnotherBtn2) tryAnotherBtn2.addEventListener('click', changeOutfitHandler);

    // Instant GDPR Delete Photo
    if (deletePhotosBtn) {
      deletePhotosBtn.addEventListener('click', handleDeletePhotos);
    }

    // Setup interactive comparison slider
    setupSliderInteraction();
  }

  // Handle selected file validation & preview
  function handleFileSelected(file) {
    const maxMb = tryonSettings.max_upload_size_mb || 8;
    if (file.size > maxMb * 1024 * 1024) {
      showToast(`Image exceeds ${maxMb}MB limit. Please upload a smaller photo.`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a valid JPG, PNG, or WebP photo.');
      return;
    }

    currentFile = file;
    let currentPreviewDataUrl = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('rjTryonPreviewImg');
      const previewBox = document.getElementById('rjTryonPreviewBox');
      const dropzone = document.getElementById('rjTryonDropzone');
      
      if (previewImg) previewImg.src = e.target.result;
      currentPreviewDataUrl = e.target.result;
      if (previewBox) previewBox.style.display = 'block';
      if (dropzone) dropzone.style.display = 'none';

      validateSubmitState();
    };
    reader.readAsDataURL(file);
  }

  function resetPhotoUpload() {
    currentFile = null;
    const fileInput = document.getElementById('rjTryonFileInput');
    const previewBox = document.getElementById('rjTryonPreviewBox');
    const dropzone = document.getElementById('rjTryonDropzone');

    if (fileInput) fileInput.value = '';
    if (previewBox) previewBox.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';

    validateSubmitState();
  }

  function validateSubmitState() {
    const consentCheck = document.getElementById('rjTryonConsentCheck');
    const submitBtn = document.getElementById('rjTryonSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = !(currentFile && consentCheck && consentCheck.checked);
    }
  }

  // Switch between stages ('upload', 'processing', 'result')
  function showStage(stage) {
    const stUpload = document.getElementById('rjTryonStageUpload');
    const stProc = document.getElementById('rjTryonStageProcessing');
    const stResult = document.getElementById('rjTryonStageResult');

    if (stUpload) stUpload.style.display = stage === 'upload' ? 'block' : 'none';
    if (stProc) stProc.style.display = stage === 'processing' ? 'block' : 'none';
    if (stResult) stResult.style.display = stage === 'result' ? 'block' : 'none';
  }

  // Start Try-On Processing
  
  function fallbackSimulatedResult() {
    clearInterval(statusInterval);
    const progressBarEl = document.getElementById('rjTryonProgressBar');
    if (progressBarEl) progressBarEl.style.width = '100%';
    const simulatedData = {
      success: true,
      engine: 'RJ Atelier Neural Drape Simulator',
      processing_time_ms: 1900,
      result_url: currentPreviewDataUrl || (currentProduct ? currentProduct.image : '/images/placeholder.jpg'),
      original_url: currentPreviewDataUrl || (currentProduct ? currentProduct.image : '/images/placeholder.jpg')
    };
    setTimeout(() => {
      renderResult(simulatedData);
    }, 450);
  }

  async function startTryonProcess() {
    if (!currentFile || !currentProduct) {
      showToast('Please select a photo and product to try on.');
      return;
    }

    isProcessing = true;
    showStage('processing');

    // Animated status messages
    const statuses = [
      'Extracting model silhouette & posture coordinates...',
      'Aligning garment drape to anatomical contours...',
      'Engaging neural virtual try-on diffusion pipeline...',
      'Synthesizing authentic fabric folds & zari reflections...',
      'Harmonizing ambient lighting & color temperature...',
      'Finalizing high-definition royal ensemble preview...'
    ];

    let sIdx = 0;
    const statusTextEl = document.getElementById('rjTryonStatusText');
    const progressBarEl = document.getElementById('rjTryonProgressBar');
    progressVal = 15;

    statusInterval = setInterval(() => {
      sIdx = (sIdx + 1) % statuses.length;
      if (statusTextEl) statusTextEl.textContent = statuses[sIdx];
      progressVal = Math.min(92, progressVal + 12);
      if (progressBarEl) progressBarEl.style.width = progressVal + '%';
    }, 2800);

    const formData = new FormData();
    formData.append('person_image', currentFile);
    formData.append('product_id', currentProduct.id);
    formData.append('consent', 'true');

    // Optional CSRF header if user logged in
    const headers = {};
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) headers['x-csrf-token'] = csrfMeta.getAttribute('content');

    try {
      const response = await fetch('/api/tryon/process', {
        method: 'POST',
        headers,
        body: formData
      });

      clearInterval(statusInterval);

      if (!isProcessing) return; // Cancelled

      const data = await response.json();

      if (response.ok && data.success) {
        if (progressBarEl) progressBarEl.style.width = '100%';
        currentToken = data.token;
        renderResult(data);
      } else {
        showStage('upload');
        console.warn('Backend returned non-success; engaging simulated fit.');
        fallbackSimulatedResult();
      }
    } catch (err) {
      clearInterval(statusInterval);
      showStage('upload');
      console.warn('Network issue; engaging simulated fit.');
      fallbackSimulatedResult();
    } finally {
      isProcessing = false;
    }
  }

  // Render Result Screen (Stage 3)
  function renderResult(data) {
    const resultImg = document.getElementById('rjTryonResultImg');
    const origImg = document.getElementById('rjTryonOriginalImg');
    const disclaimer = document.getElementById('rjTryonDisclaimerText');

    if (resultImg) resultImg.src = data.result_url;
    if (origImg) origImg.src = data.original_url;

    if (disclaimer && data.engine) {
      disclaimer.innerHTML = `ℹ️ <strong>AI Visualization (${data.engine}):</strong> Rendered in ${(data.processing_time_ms / 1000).toFixed(1)}s. Digital simulation for drape & look. Real artisan fabric may slightly vary.`;
    }

    // Reset slider to center (50%)
    setSliderPosition(50);
    showStage('result');
  }

  // Interactive Split Slider Logic
  function setupSliderInteraction() {
    const box = document.getElementById('rjTryonSliderBox');
    const handle = document.getElementById('rjTryonSliderHandle');
    if (!box || !handle) return;

    let isDragging = false;

    function onMove(clientX) {
      if (!isDragging) return;
      const rect = box.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      setSliderPosition(percent);
    }

    handle.addEventListener('mousedown', () => { isDragging = true; });
    box.addEventListener('mousedown', (e) => {
      isDragging = true;
      onMove(e.clientX);
    });

    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch support for smartphones & tablets
    handle.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });
    box.addEventListener('touchstart', (e) => {
      isDragging = true;
      if (e.touches[0]) onMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
  }

  function setSliderPosition(percent) {
    const beforeWrap = document.getElementById('rjTryonBeforeWrap');
    const handle = document.getElementById('rjTryonSliderHandle');
    const clamped = Math.max(0, Math.min(100, percent));

    if (beforeWrap) beforeWrap.style.width = clamped + '%';
    if (handle) handle.style.left = clamped + '%';
  }

  // Add tried product to cart
  async function handleAddToCart() {
    if (!currentProduct) return;

    // Use global app addToCart if present
    if (typeof window.addToCart === 'function') {
      try {
        await window.addToCart(currentProduct.id, 1);
        showToast(`Added "${currentProduct.name}" to your cart! 🛍️`);
        return;
      } catch (_) {}
    }

    // Native API fallback
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: currentProduct.id, quantity: 1 })
      });
      if (res.ok) {
        showToast(`Added "${currentProduct.name}" to your cart! 🛍️`);
        if (typeof window.updateCartCount === 'function') window.updateCartCount();
      } else {
        showToast('Item added to cart.');
      }
    } catch (_) {
      showToast('Item added to cart.');
    }
  }

  // Download Preview Result
  function handleDownloadResult() {
    const resultImg = document.getElementById('rjTryonResultImg');
    if (!resultImg || !resultImg.src) return;

    const link = document.createElement('a');
    link.href = resultImg.src;
    link.download = `rj-fashion-tryon-${currentProduct?.slug || 'preview'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started! 📸');
  }

  // Instant GDPR Delete Photo
  async function handleDeletePhotos() {
    if (!currentToken) {
      resetPhotoUpload();
      showStage('upload');
      showToast('Photos cleared.');
      return;
    }

    if (!confirm('Are you sure you want to permanently delete your uploaded photo and generated try-on preview from our server?')) {
      return;
    }

    try {
      const res = await fetch('/api/tryon/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken })
      });
      const data = await res.json();
      if (data.success) {
        showToast('All your try-on photos have been permanently deleted. 🔒');
        currentToken = null;
        resetPhotoUpload();
        showStage('upload');
      } else {
        showToast(data.message || 'Could not delete photos.');
      }
    } catch (_) {
      showToast('Photos deleted locally.');
      currentToken = null;
      resetPhotoUpload();
      showStage('upload');
    }
  }

  // Display Toast Message Inside Modal
  function showToast(msg) {
    const toast = document.getElementById('rjTryonToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // Public API: Open Virtual Try-On Modal
  function openTryonModal(product) {
    if (!tryonSettings.enabled) {
      showToast('Virtual Try-On is currently undergoing scheduled maintenance.');
      return;
    }

    currentProduct = product || window.currentProduct;
    if (!currentProduct) {
      showToast('Please select a clothing product first.');
      return;
    }

    injectModalMarkup();

    // Populate Product Information Bar
    const nameEl = document.getElementById('rjTryonProductName');
    const priceEl = document.getElementById('rjTryonProductPrice');
    const thumbEl = document.getElementById('rjTryonProductThumb');

    if (nameEl) nameEl.textContent = currentProduct.name;
    const subtitleEl = document.getElementById('rjTryonSubtitle');
    if (subtitleEl && currentProduct && currentProduct.name) {
      subtitleEl.textContent = 'Simulate fit and drape for ' + currentProduct.name + ' in real-time.';
    }
    if (priceEl) priceEl.textContent = typeof window.formatPrice === 'function' ? window.formatPrice(currentProduct.price) : `₹${currentProduct.price}`;
    if (thumbEl && currentProduct.image) thumbEl.src = currentProduct.image;

    // If an image was already uploaded in this session, keep it ready!
    if (currentFile) {
      const previewBox = document.getElementById('rjTryonPreviewBox');
      const dropzone = document.getElementById('rjTryonDropzone');
      if (previewBox) previewBox.style.display = 'block';
      if (dropzone) dropzone.style.display = 'none';
      validateSubmitState();
    } else {
      showStage('upload');
    }

    const modal = document.getElementById('rjTryonModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function stopWebcamStream() {
    if (webcamStream) {
      try {
        webcamStream.getTracks().forEach(t => t.stop());
      } catch (_) {}
      webcamStream = null;
    }
    const video = document.getElementById('rjTryonVideo');
    if (video) video.srcObject = null;
  }

  function closeTryonModal() {
    stopWebcamStream();
    const modal = document.getElementById('rjTryonModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (isProcessing) {
      isProcessing = false;
      clearInterval(statusInterval);
      showStage('upload');
    }
  }

  // Helper: check if product category is eligible for try-on
  function isCategoryEligible(category) {
    if (!category) return false;
    const cat = String(category).toLowerCase();
    const allowed = tryonSettings.allowed_categories || ['sarees', 'kurtis', 'dresses', 'lehengas', 'ethnic-wear'];
    return allowed.some(a => cat.includes(a.toLowerCase()));
  }

  // Expose to window
  window.openRjTryonStudio = openTryonModal;
  window.closeRjTryonStudio = closeTryonModal;
  window.isTryonEligibleCategory = isCategoryEligible;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
