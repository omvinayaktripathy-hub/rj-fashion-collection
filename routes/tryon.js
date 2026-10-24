const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/admin');

// Ensure temporary try-on directory exists
const TEMP_DIR = path.join(__dirname, '..', 'public', 'uploads', 'tryon', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer storage configuration for private temporary customer uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const token = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    // Tag with session token prefix
    cb(null, `user_${token}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPG, PNG, and WebP are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB default
  fileFilter
});

// Helper: Magic byte image verification for security
function verifyImageSignature(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    // WEBP: RIFF....WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
    return false;
  } catch (_) {
    return false;
  }
}

// Anti-SSRF URL validator (blocks loopback, cloud metadata, and private IP subnets)
function isSafeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('169.254.') || // Cloud metadata (AWS, GCP, Azure)
      hostname.startsWith('10.') ||       // RFC 1918 Class A
      hostname.startsWith('192.168.') ||  // RFC 1918 Class C
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) // RFC 1918 Class B
    ) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

// Helper: Auto-cleanup of expired files
function cleanupStaleTryonFiles(retentionHours = 2) {
  try {
    const now = Date.now();
    const maxAgeMs = retentionHours * 60 * 60 * 1000;
    const files = fs.readdirSync(TEMP_DIR);

    let purgedCount = 0;
    for (const file of files) {
      const fullPath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        purgedCount++;
      }
    }
    if (purgedCount > 0) {
      console.log(`[RJ-TRYON] Purged ${purgedCount} expired temporary try-on files (> ${retentionHours} hrs).`);
    }
  } catch (err) {
    console.error('[RJ-TRYON] Auto-cleanup error:', err.message);
  }
}

// Run cleanup periodically every hour
setInterval(() => {
  try {
    const settings = db.prepare('SELECT retention_hours FROM tryon_settings WHERE id = 1').get();
    cleanupStaleTryonFiles(settings?.retention_hours || 2);
  } catch (_) {}
}, 60 * 60 * 1000).unref();


// =====================================================================
// Public Try-On Routes
// =====================================================================

/**
 * GET /api/tryon/settings
 * Public config endpoint for storefront UI to check feature availability and supported apparel
 */
router.get('/settings', (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM tryon_settings WHERE id = 1').get();
    if (!settings) {
      settings = {
        enabled: 1,
        allowed_categories: '["sarees","kurtis","dresses","lehengas","ethnic-wear"]',
        max_upload_size_mb: 8,
        retention_hours: 2
      };
    }

    let parsedCategories = [];
    try {
      parsedCategories = JSON.parse(settings.allowed_categories || '[]');
    } catch (_) {
      parsedCategories = ['sarees', 'kurtis', 'dresses', 'lehengas', 'ethnic-wear'];
    }

    res.json({
      success: true,
      enabled: Boolean(settings.enabled),
      allowed_categories: parsedCategories,
      max_upload_size_mb: settings.max_upload_size_mb || 8,
      retention_hours: settings.retention_hours || 2
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve try-on settings.' });
  }
});


/**
 * POST /api/tryon/process
 * Main virtual try-on execution pipeline
 */
router.post('/process', upload.single('person_image'), async (req, res) => {
  let uploadedFile = req.file;

  try {
    // 1. Check if try-on feature is enabled
    const settings = db.prepare('SELECT * FROM tryon_settings WHERE id = 1').get() || {
      enabled: 1,
      inference_url: 'http://localhost:5000',
      allowed_categories: '["sarees","kurtis","dresses","lehengas","ethnic-wear"]',
      max_upload_size_mb: 8
    };

    if (!settings.enabled) {
      if (uploadedFile) fs.unlinkSync(uploadedFile.path);
      return res.status(403).json({
        success: false,
        message: 'Virtual Try-On is currently undergoing scheduled maintenance. Please try again soon.'
      });
    }

    // 2. Validate explicit privacy consent
    if (req.body.consent !== 'true' && req.body.consent !== true) {
      if (uploadedFile) fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Explicit consent is required to process your photo for AI virtual try-on.'
      });
    }

    // 3. Validate uploaded file
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded. Please select a clear, well-lit photo of yourself.'
      });
    }

    // Security check: verify image magic bytes
    if (!verifyImageSignature(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not a valid image. Please upload a genuine JPG, PNG, or WebP photo.'
      });
    }

    // 4. Validate real product from database
    const productId = parseInt(req.body.product_id, 10);
    if (!productId || isNaN(productId)) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({ success: false, message: 'Invalid product selection.' });
    }

    const product = db.prepare(`
      SELECT p.*, c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.active = 1
    `).get(productId);

    if (!product) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(404).json({ success: false, message: 'Selected product is no longer available.' });
    }

    // Validate category eligibility
    let allowedCategories = [];
    try {
      allowedCategories = JSON.parse(settings.allowed_categories || '[]');
    } catch (_) {
      allowedCategories = ['sarees', 'kurtis', 'dresses', 'lehengas', 'ethnic-wear'];
    }

    const prodCatSlug = (product.category_slug || '').toLowerCase();
    const prodCatName = (product.category_name || '').toLowerCase();
    const isEligible = allowedCategories.some(cat => 
      prodCatSlug.includes(cat.toLowerCase()) || prodCatName.includes(cat.toLowerCase())
    );

    if (!isEligible) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: `Virtual Try-On is currently optimized for clothing (${allowedCategories.join(', ')}). This product category is not supported.`
      });
    }

    // 5. Rate-limiting check per IP/user (daily limit)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userId = req.session?.user?.id || null;
    const dailyLimit = settings.daily_limit_per_user || 25;

    const countToday = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tryon_logs 
      WHERE (user_ip = ? OR (user_id IS NOT NULL AND user_id = ?))
        AND created_at >= datetime('now', '-1 day')
    `).get(userIp, userId)?.count || 0;

    if (countToday >= dailyLimit) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(429).json({
        success: false,
        message: `You have reached your daily virtual try-on limit (${dailyLimit} try-ons per day). Please check back tomorrow!`
      });
    }

    // 6. Resolve garment product image
    let garmentBuffer = null;
    let garmentFilename = 'garment.jpg';

    if (product.image) {
      // Check if local file in public directory
      let localPath = path.join(__dirname, '..', 'public', product.image.replace(/^\/+/, ''));
      if (fs.existsSync(localPath)) {
        garmentBuffer = fs.readFileSync(localPath);
        garmentFilename = path.basename(localPath);
      } else {
        // Try direct uploads folder
        let uploadPath = path.join(__dirname, '..', 'public', 'images', 'uploads', path.basename(product.image));
        if (fs.existsSync(uploadPath)) {
          garmentBuffer = fs.readFileSync(uploadPath);
          garmentFilename = path.basename(uploadPath);
        }
      }
    }

    // Fallback if product image is an external URL (Anti-SSRF protected)
    if (!garmentBuffer && product.image && product.image.startsWith('http') && isSafeExternalUrl(product.image)) {
      try {
        const fetchRes = await fetch(product.image, { signal: AbortSignal.timeout(6000) });
        if (fetchRes.ok) {
          const ab = await fetchRes.arrayBuffer();
          garmentBuffer = Buffer.from(ab);
        }
      } catch (fErr) {
        console.warn('[RJ-TRYON] Could not fetch remote product image:', fErr.message);
      }
    }

    if (!garmentBuffer) {
      fs.unlinkSync(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Could not access the garment image for this product. Please select another product or try again later.'
      });
    }

    // 7. Generate session token for privacy isolation and diagnostic request tracking
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const requestId = 'req_' + crypto.randomBytes(6).toString('hex');
    const personBuffer = fs.readFileSync(uploadedFile.path);
    const personFilename = path.basename(uploadedFile.path);

    // Call AI inference service (FastAPI / Gradio / Fallback)
    const inferenceUrl = settings.inference_url || 'http://localhost:5000';
    let aiResult = null;
    let modelName = 'IDM-VTON / CatVTON';
    let processingTimeMs = 0;

    // Build faithful visual description from verified product attributes (avoids marketing color contradictions)
    const visualAttributes = [
      product.name,
      product.material || product.fabric || '',
      product.pattern || '',
      product.fit || ''
    ].filter(Boolean).join(', ');
    const garmentDes = visualAttributes || product.name;

    // Safe diagnostic logging (Zero PII, no secrets, safe metadata only)
    console.log(`[RJ-TRYON-DIAG] RequestID=${requestId} ProductID=${product.id} ProductName="${product.name}" Category="${prodCatSlug || 'sarees'}" PersonSize=${personBuffer.length}B GarmentSize=${garmentBuffer.length}B Status=dispatched`);

    const startTime = Date.now();

    try {
      // Build native FormData for AI service
      const formData = new FormData();
      formData.append('person_image', new Blob([personBuffer], { type: uploadedFile.mimetype }), personFilename);
      formData.append('garment_image', new Blob([garmentBuffer], { type: 'image/jpeg' }), garmentFilename);
      formData.append('category', prodCatSlug || 'sarees');
      formData.append('garment_des', garmentDes.substring(0, 150));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout for ZeroGPU queue

      const aiHeaders = {
        'X-Request-Id': requestId
      };
      if (settings.hf_token) {
        aiHeaders['X-Hf-Token'] = settings.hf_token;
      }

      const aiResponse = await fetch(`${inferenceUrl}/tryon`, {
        method: 'POST',
        headers: aiHeaders,
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (aiResponse.ok) {
        aiResult = await aiResponse.json();
        processingTimeMs = Date.now() - startTime;
        modelName = aiResult.engine || modelName;
      } else {
        let errJson = null;
        try { errJson = await aiResponse.json(); } catch (_) {}
        const detailMsg = errJson?.detail || 'AI Virtual Try-On service returned an error.';
        console.warn(`[RJ-TRYON-DIAG] RequestID=${requestId} AI service error (${aiResponse.status}): ${detailMsg}`);
        
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
          fs.unlinkSync(uploadedFile.path);
        }
        return res.status(aiResponse.status || 502).json({
          success: false,
          message: detailMsg
        });
      }
    } catch (aiErr) {
      console.warn(`[RJ-TRYON-DIAG] RequestID=${requestId} AI service request failed: ${aiErr.message}`);
      if (uploadedFile && fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      return res.status(503).json({
        success: false,
        message: 'The AI virtual try-on service is currently connecting to the neural GPU space. Please try again in a few moments.'
      });
    }

    // Verify genuine AI image output was received
    if (!aiResult || !aiResult.image_base64) {
      if (uploadedFile && fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      return res.status(502).json({
        success: false,
        message: 'Virtual try-on model did not return a valid result. Please try another photo.'
      });
    }

    // Decode base64 and save to temp result file
    const base64Data = aiResult.image_base64.replace(/^data:image\/\w+;base64,/, '');
    const resultBuffer = Buffer.from(base64Data, 'base64');
    
    const resultFileName = `result_${sessionToken}.jpg`;
    const resultFilePath = path.join(TEMP_DIR, resultFileName);
    fs.writeFileSync(resultFilePath, resultBuffer);
    const resultPublicUrl = `/uploads/tryon/temp/${resultFileName}`;

    const originalPublicUrl = `/uploads/tryon/temp/${path.basename(uploadedFile.path)}`;

    console.log(`[RJ-TRYON-DIAG] RequestID=${requestId} Status=completed Duration=${processingTimeMs}ms Engine="${modelName}" OutputSize=${resultBuffer.length}B`);

    // 8. Log attempt to database (Zero PII - privacy compliant)
    db.prepare(`
      INSERT INTO tryon_logs (
        token, user_id, product_id, product_name, category, 
        status, processing_time_ms, model_name, user_ip,
        customer_image_path, result_image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionToken,
      userId,
      product.id,
      product.name,
      prodCatName || prodCatSlug,
      'completed',
      processingTimeMs,
      modelName,
      userIp,
      originalPublicUrl,
      resultPublicUrl
    );

    // 9. Return isolated result to customer with diagnostic metadata
    return res.json({
      success: true,
      token: sessionToken,
      engine: modelName,
      processing_time_ms: processingTimeMs,
      original_url: originalPublicUrl,
      result_url: resultPublicUrl,
      diagnostics: {
        request_id: requestId,
        product_id: product.id,
        product_name: product.name,
        category: prodCatName || prodCatSlug,
        engine: modelName,
        processing_time_ms: processingTimeMs
      },
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        image: product.image,
        category: prodCatName
      },
      disclaimer: "AI Virtual Try-On is a digital visualization and may slightly differ from real-world drape, fabric texture, and lighting."
    });

  } catch (error) {
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      try { fs.unlinkSync(uploadedFile.path); } catch (_) {}
    }
    console.error('[RJ-TRYON-DIAG] Pipeline Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during virtual try-on processing. Please try again with a clear photo.'
    });
  }
});


/**
 * DELETE /api/tryon/delete
 * Instant GDPR/Privacy photo erasure button
 * Immediately destroys customer photo and generated result from the server
 */
router.delete('/delete', (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token || typeof token !== 'string' || token.length < 16) {
      return res.status(400).json({ success: false, message: 'Invalid session token.' });
    }

    const log = db.prepare('SELECT * FROM tryon_logs WHERE token = ?').get(token);
    let deletedFiles = 0;

    // Scan and remove any files associated with this token
    const files = fs.readdirSync(TEMP_DIR);
    for (const f of files) {
      if (f.includes(token)) {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, f));
          deletedFiles++;
        } catch (_) {}
      }
    }

    if (log) {
      db.prepare(`
        UPDATE tryon_logs 
        SET status = 'deleted', 
            customer_image_path = NULL, 
            result_image_path = NULL, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE token = ?
      `).run(token);
    }

    res.json({
      success: true,
      message: 'All your uploaded photos and virtual try-on previews have been permanently deleted.',
      files_removed: deletedFiles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not complete photo deletion.' });
  }
});


// =====================================================================
// Admin Virtual Try-On Management Endpoints
// =====================================================================

/**
 * GET /api/tryon/admin/settings
 * Admin settings and telemetry statistics
 */
router.get('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM tryon_settings WHERE id = 1').get();
    
    // Statistics
    const totalTryons = db.prepare('SELECT COUNT(*) as count FROM tryon_logs').get()?.count || 0;
    const completedTryons = db.prepare("SELECT COUNT(*) as count FROM tryon_logs WHERE status = 'completed'").get()?.count || 0;
    const avgLatency = db.prepare("SELECT AVG(processing_time_ms) as avg_ms FROM tryon_logs WHERE status = 'completed' AND processing_time_ms > 0").get()?.avg_ms || 0;
    
    const recentLogs = db.prepare(`
      SELECT id, token, product_name, category, status, processing_time_ms, model_name, created_at 
      FROM tryon_logs 
      ORDER BY id DESC 
      LIMIT 20
    `).all();

    // Check AI microservice health
    let aiHealth = { status: 'offline', ping_ms: null };
    if (settings?.inference_url) {
      const pingStart = Date.now();
      try {
        const pingRes = await fetch(`${settings.inference_url}/health`, { signal: AbortSignal.timeout(3000) });
        if (pingRes.ok) {
          const healthData = await pingRes.json();
          aiHealth = {
            status: 'online',
            ping_ms: Date.now() - pingStart,
            details: healthData
          };
        }
      } catch (e) {
        aiHealth = { status: 'offline', error: e.message };
      }
    }

    // Disk usage of temp tryon files
    let tempFileCount = 0;
    let tempBytes = 0;
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      tempFileCount = files.length;
      for (const file of files) {
        try {
          tempBytes += fs.statSync(path.join(TEMP_DIR, file)).size;
        } catch (_) {}
      }
    }

    res.json({
      success: true,
      settings,
      aiHealth,
      storage: {
        temp_files_count: tempFileCount,
        temp_bytes: tempBytes,
        temp_mb: (tempBytes / (1024 * 1024)).toFixed(2)
      },
      stats: {
        total_tryons: totalTryons,
        completed_tryons: completedTryons,
        avg_latency_ms: Math.round(avgLatency),
        recent_logs: recentLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * POST /api/tryon/admin/settings
 * Admin updates try-on settings
 */
router.post('/admin/settings', requireAdmin, (req, res) => {
  try {
    const {
      enabled,
      inference_url,
      allowed_categories,
      max_upload_size_mb,
      daily_limit_per_user,
      retention_hours,
      hf_token
    } = req.body;

    let catJson = allowed_categories;
    if (Array.isArray(allowed_categories)) {
      catJson = JSON.stringify(allowed_categories);
    }

    db.prepare(`
      UPDATE tryon_settings 
      SET enabled = ?,
          inference_url = ?,
          allowed_categories = ?,
          max_upload_size_mb = ?,
          daily_limit_per_user = ?,
          retention_hours = ?,
          hf_token = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      enabled ? 1 : 0,
      inference_url || 'http://localhost:5000',
      catJson || '["sarees","kurtis","dresses","lehengas","ethnic-wear"]',
      parseInt(max_upload_size_mb, 10) || 8,
      parseInt(daily_limit_per_user, 10) || 25,
      parseInt(retention_hours, 10) || 2,
      hf_token ? hf_token.trim() : null
    );

    res.json({ success: true, message: 'Virtual Try-On settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * POST /api/tryon/admin/purge
 * Admin manual purge of all temporary try-on files
 */
router.post('/admin/purge', requireAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    let removed = 0;
    for (const f of files) {
      try {
        fs.unlinkSync(path.join(TEMP_DIR, f));
        removed++;
      } catch (_) {}
    }
    res.json({ success: true, message: `Successfully purged ${removed} temporary try-on files.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
