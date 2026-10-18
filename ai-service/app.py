"""
RJ Fashion Collection — Free AI Virtual Try-On Service
=====================================================
Multi-mode, zero-cost AI Inference Service for Virtual Apparel Try-On.
Integrates real IDM-VTON deep learning virtual try-on model.
"""

import os
import sys
import io
import time
import json
import uuid
import base64
import logging
import shutil
from pathlib import Path
from typing import Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [RJ-AI-TRYON] %(message)s"
)
logger = logging.getLogger("rj_tryon_service")

# Service Configuration
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "5000"))
TRYON_MODE = os.environ.get("TRYON_MODE", "gradio_free")
HF_SPACE_NAME = os.environ.get("HF_SPACE_NAME", "yisol/IDM-VTON")
HF_TOKEN = os.environ.get("HF_TOKEN", None)
MAX_IMAGE_SIZE_MB = int(os.environ.get("MAX_IMAGE_SIZE_MB", "10"))

# Alternate HF Spaces for failover redundancy
BACKUP_SPACES = [
    "Wild-Heart/IDM-VTON",
    "Nymbo/Virtual-Try-On"
]

# Telemetry stats
STATS = {
    "started_at": time.time(),
    "requests_total": 0,
    "requests_success": 0,
    "requests_failed": 0,
    "last_mode_used": None,
    "last_processing_time_ms": 0
}

# Image processing helpers
try:
    from PIL import Image, ImageOps, ImageFilter, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("Pillow not installed.")

try:
    from gradio_client import Client, handle_file
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False
    logger.warning("gradio_client not installed.")

try:
    import torch
    TORCH_AVAILABLE = True
    CUDA_AVAILABLE = torch.cuda.is_available()
    VRAM_MB = torch.cuda.get_device_properties(0).total_memory // (1024 * 1024) if CUDA_AVAILABLE else 0
except ImportError:
    TORCH_AVAILABLE = False
    CUDA_AVAILABLE = False
    VRAM_MB = 0


def perform_gradio_inference(person_bytes: bytes, garment_bytes: bytes, category: str, garment_des: str = "") -> tuple[bytes, str]:
    """
    Submits person and garment to Hugging Face IDM-VTON real AI virtual try-on model.
    """
    if not GRADIO_AVAILABLE:
        raise RuntimeError("gradio_client package is not installed. Install via `pip install gradio_client`.")

    temp_dir = Path("./temp_ai_cache")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    req_id = uuid.uuid4().hex
    person_path = temp_dir / f"p_{req_id}.jpg"
    garment_path = temp_dir / f"g_{req_id}.jpg"

    # Pre-process & normalize with PIL if available (resize to standard diffusion aspect ~768x1024)
    if PIL_AVAILABLE:
        p_img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
        p_img = ImageOps.exif_transpose(p_img)
        # Cap dimension to maximum 1280 to optimize inference latency
        p_img.thumbnail((1024, 1280), Image.Resampling.LANCZOS)
        p_img.save(person_path, format="JPEG", quality=95)

        g_img = Image.open(io.BytesIO(garment_bytes)).convert("RGB")
        g_img = ImageOps.exif_transpose(g_img)
        g_img.thumbnail((1024, 1280), Image.Resampling.LANCZOS)
        g_img.save(garment_path, format="JPEG", quality=95)
    else:
        person_path.write_bytes(person_bytes)
        garment_path.write_bytes(garment_bytes)

    spaces_to_try = [HF_SPACE_NAME] + [s for s in BACKUP_SPACES if s != HF_SPACE_NAME]
    last_err = None

    try:
        cat_lower = (category or "").lower()
        garment_description = garment_des or f"RJ Fashion luxury Indian {category}"

        for space in spaces_to_try:
            try:
                logger.info(f"Connecting to Hugging Face Space '{space}'...")
                client = Client(space, token=HF_TOKEN if HF_TOKEN else None)
                
                logger.info(f"Submitting to {space} /tryon with garment: {garment_description[:50]}...")
                result = client.predict(
                    dict={"background": handle_file(str(person_path)), "layers": [], "composite": None},
                    garm_img=handle_file(str(garment_path)),
                    garment_des=garment_description,
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )

                out_path = result[0] if isinstance(result, (list, tuple)) else result
                if out_path and Path(out_path).exists() and Path(out_path).stat().st_size > 1000:
                    logger.info(f"SUCCESS: Real AI Virtual Try-On image generated via {space} ({Path(out_path).stat().st_size} bytes)")
                    
                    # Convert to JPEG bytes
                    if PIL_AVAILABLE:
                        res_img = Image.open(out_path).convert("RGB")
                        buf = io.BytesIO()
                        res_img.save(buf, format="JPEG", quality=92, optimize=True)
                        return buf.getvalue(), f"IDM-VTON ({space})"
                    else:
                        return Path(out_path).read_bytes(), f"IDM-VTON ({space})"
                else:
                    raise RuntimeError("Inference did not return a valid output file.")

            except Exception as e:
                err_msg = str(e)
                last_err = e
                logger.warning(f"Failed attempt on {space}: {err_msg}")
                # If IndexError on pose detection, it means human keypoints weren't found
                if "IndexError" in err_msg or "NoneType" in err_msg:
                    raise ValueError("Human figure could not be detected in this photo. Please upload a clear photo showing your upper body/pose with good lighting.")

        raise RuntimeError(f"All virtual try-on AI spaces were currently busy or unavailable. Details: {str(last_err)}")

    finally:
        if person_path.exists():
            person_path.unlink(missing_ok=True)
        if garment_path.exists():
            garment_path.unlink(missing_ok=True)


def process_tryon(person_bytes: bytes, garment_bytes: bytes, category: str, garment_des: str = "") -> dict:
    """
    Main orchestration router: Invokes real IDM-VTON virtual try-on model.
    """
    start_time = time.time()
    STATS["requests_total"] += 1
    
    # Execute Real AI Model Inference
    result_bytes, engine_used = perform_gradio_inference(person_bytes, garment_bytes, category, garment_des)

    duration_ms = int((time.time() - start_time) * 1000)
    STATS["requests_success"] += 1
    STATS["last_mode_used"] = engine_used
    STATS["last_processing_time_ms"] = duration_ms

    b64_img = base64.b64encode(result_bytes).decode("utf-8")
    return {
        "success": True,
        "engine": engine_used,
        "processing_time_ms": duration_ms,
        "image_base64": f"data:image/jpeg;base64,{b64_img}",
        "message": f"AI Virtual Try-On preview generated successfully using {engine_used}."
    }


# =====================================================================
# FastAPI Application
# =====================================================================
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="RJ Fashion Collection - AI Virtual Try-On API",
    version="2.0.0",
    description="Real AI Virtual Fitting Room API powered by IDM-VTON deep learning model."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "RJ Fashion Collection Real AI Virtual Try-On",
        "version": "2.0.0",
        "active_model": "IDM-VTON",
        "hf_space": HF_SPACE_NAME,
        "gradio_client_installed": GRADIO_AVAILABLE,
        "cuda_available": CUDA_AVAILABLE,
        "gpu_vram_mb": VRAM_MB,
        "stats": STATS
    }

@app.post("/tryon")
async def tryon_endpoint(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    category: str = Form("sarees"),
    garment_des: Optional[str] = Form("")
):
    # Validate MIME types
    valid_mimes = ["image/jpeg", "image/png", "image/webp"]
    if person_image.content_type not in valid_mimes:
        raise HTTPException(status_code=400, detail="Invalid person image format. Allowed: JPG, PNG, WEBP.")
    if garment_image.content_type not in valid_mimes:
        raise HTTPException(status_code=400, detail="Invalid garment image format. Allowed: JPG, PNG, WEBP.")

    p_bytes = await person_image.read()
    g_bytes = await garment_image.read()

    max_bytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(p_bytes) > max_bytes or len(g_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Image exceeds maximum limit of {MAX_IMAGE_SIZE_MB}MB.")

    try:
        res = process_tryon(p_bytes, g_bytes, category, garment_des or "")
        return JSONResponse(status_code=200, content=res)
    except ValueError as ve:
        STATS["requests_failed"] += 1
        logger.warning(f"Validation notice: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        STATS["requests_failed"] += 1
        logger.error(f"TryOn inference error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI Try-On model error: {str(e)}")


def run_fastapi():
    import uvicorn
    logger.info(f"Starting RJ Fashion AI Service on http://{HOST}:{PORT}...")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    run_fastapi()
