import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  X,
  Upload,
  Camera,
  Users,
  ShieldCheck,
  ShoppingBag,
  Download,
  Share2,
  RotateCcw,
  Check,
  Sliders,
  ChevronRight,
  Eye
} from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface DressingRoomProduct {
  id: string | number;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  original_price?: number;
  image: string;
  available_sizes?: string[] | string;
  fabric?: string;
  stock?: number;
}

export interface PresetMannequin {
  id: string;
  size: 'S' | 'M' | 'L' | 'XL';
  label: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  avatar: string;
  fitOverlayImage: string;
}

export interface AIVirtualDressingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: DressingRoomProduct | null;
  onAddToCart?: (product: DressingRoomProduct, size: string) => Promise<boolean | void> | boolean | void;
  onShareLook?: (lookData: { productId: string | number; size: string; imageUrl: string }) => void;
}

/* =========================================================================
   PRESET MANNEQUIN MODELS WITH ANATOMICAL MEASUREMENTS
   ========================================================================= */

export const PRESET_MANNEQUINS: PresetMannequin[] = [
  {
    id: 'mannequin-s',
    size: 'S',
    label: 'Petite Silhouette',
    height: "5'5\" (165 cm)",
    bust: "33\" (84 cm)",
    waist: "26\" (66 cm)",
    hips: "36\" (91 cm)",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    fitOverlayImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mannequin-m',
    size: 'M',
    label: 'Classic Royal Fit',
    height: "5'7\" (170 cm)",
    bust: "36\" (91 cm)",
    waist: "29\" (74 cm)",
    hips: "39\" (99 cm)",
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    fitOverlayImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mannequin-l',
    size: 'L',
    label: 'Statuesque Curve',
    height: "5'8\" (173 cm)",
    bust: "39\" (99 cm)",
    waist: "33\" (84 cm)",
    hips: "42\" (107 cm)",
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    fitOverlayImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'mannequin-xl',
    size: 'XL',
    label: 'Regal Majesty',
    height: "5'9\" (175 cm)",
    bust: "43\" (109 cm)",
    waist: "37\" (94 cm)",
    hips: "46\" (117 cm)",
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80',
    fitOverlayImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
  }
];

function formatPrice(amount?: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

/* =========================================================================
   COMPONENT: AIVirtualDressingRoomModal
   ========================================================================= */

export const AIVirtualDressingRoomModal: React.FC<AIVirtualDressingRoomModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onShareLook
}) => {
  // Step 1 Selection Mode: 'preset' | 'upload' | 'camera'
  const [silhouetteMode, setSilhouetteMode] = useState<'preset' | 'upload' | 'camera'>('preset');

  // Interactive Stage: 'selection' | 'processing' | 'simulation'
  const [stage, setStage] = useState<'selection' | 'processing' | 'simulation'>('selection');

  // Silhouette / Model Selections
  const [selectedMannequin, setSelectedMannequin] = useState<PresetMannequin>(PRESET_MANNEQUINS[1]);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Camera & Webcam
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1.5s Scanning Laser Light Bar Animation State
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('Initializing garment mesh...');

  // Draggable Split Comparison Slider (0 to 100)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  // UI Toast feedback
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);
  const [isSharedSuccess, setIsSharedSuccess] = useState<boolean>(false);

  // Active product fallback
  const activeGarment = useMemo<DressingRoomProduct>(() => {
    return product || {
      id: 1,
      name: 'Royal Pure Silk Zari Saree',
      brand: 'RJ COLLECTION COUTURE',
      price: 3499,
      original_price: 6999,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      fabric: 'Pure Mulberry Silk with 240-GSM Zari Weave',
      available_sizes: ['S', 'M', 'L', 'XL']
    };
  }, [product]);

  // Keyboard ESC support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up camera on close
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isOpen || silhouetteMode !== 'camera') {
      stopCamera();
    }
  }, [isOpen, silhouetteMode, stopCamera]);

  // Toggle Camera
  const startCamera = async () => {
    try {
      stopCamera();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera stream is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (_) {
      alert('Camera access denied or unavailable. Please choose a preset mannequin or upload a photo.');
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setUploadedPhotoUrl(dataUrl);
    stopCamera();
    setSilhouetteMode('upload');
  };

  // Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setUploadedPhotoUrl(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Trigger 1.5-Second Simulation
  const runLiveSimulation = () => {
    setStage('processing');
    setScanProgress(10);
    setScanStatusText('Processing AI Drape...');

    const stepMessages = [
      'Processing AI Drape...',
      'Mapping fabric tensile contours...',
      'Synthesizing authentic silhouette blend...'
    ];

    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step < stepMessages.length) setScanStatusText(stepMessages[step]);
      setScanProgress((prev) => Math.min(95, prev + 30));
    }, 450);

    setTimeout(() => {
      clearInterval(timer);
      setScanProgress(100);
      setStage('simulation');
    }, 1500);
  };

  // Comparison slider movement
  const handleMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Cart action
  const handleAddFittedSizeToCart = async () => {
    if (onAddToCart) {
      await onAddToCart(activeGarment, selectedSize);
    } else if (typeof window !== 'undefined' && (window as any).addToCart) {
      await (window as any).addToCart(activeGarment.id, 1, selectedSize);
    }
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2400);
  };

  // Share action
  const handleShareLook = () => {
    if (onShareLook) {
      onShareLook({
        productId: activeGarment.id,
        size: selectedSize,
        imageUrl: activeGarment.image
      });
    }
    setIsSharedSuccess(true);
    setTimeout(() => setIsSharedSuccess(false), 2400);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dressing-room-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-700 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
            </div>
            <div>
              <h2 id="dressing-room-title" className="font-serif text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                ✨ AI Virtual Dressing Room
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Simulate fit and drape for <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{activeGarment.name}</strong> in real-time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dressing Room"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-200/50 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ================= STAGE 1: SELECTION & SPLIT PREVIEW ================= */}
          {stage === 'selection' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Garment Overview */}
              <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-neutral-50 dark:bg-[#18181F] border border-neutral-200/70 dark:border-neutral-800">
                <div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 mb-2">
                    <span>Garment Under Inspection</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Active Selection</span>
                  </div>

                  {/* Garment Image */}
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-900 mb-3 shadow-inner">
                    <img
                      src={activeGarment.image}
                      alt={activeGarment.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      Front Drape
                    </div>
                  </div>

                  {/* Garment Metadata */}
                  <h3 className="font-serif font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
                    {activeGarment.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                      {formatPrice(activeGarment.price)}
                    </span>
                    {activeGarment.original_price && activeGarment.original_price > activeGarment.price && (
                      <span className="text-xs text-neutral-400 line-through font-mono">
                        {formatPrice(activeGarment.original_price)}
                      </span>
                    )}
                  </div>

                  {/* Size Pill Selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
                      Selected Size Pill: <span className="text-amber-600 dark:text-amber-400">{selectedSize}</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['S', 'M', 'L', 'XL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setSelectedSize(sz);
                            const match = PRESET_MANNEQUINS.find(m => m.size === sz);
                            if (match) setSelectedMannequin(match);
                          }}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-amber-500 dark:text-neutral-950 dark:border-amber-500 shadow-sm'
                              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fabric Details */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <strong>Fabric Spec:</strong> {activeGarment.fabric || 'Pure Mulberry Silk with artisan zari embroidery.'}
                  </div>
                </div>
              </div>

              {/* Right Column: Step 1 - Model / Silhouette Selection */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Mode Navigation Tabs */}
                  <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-4 border border-neutral-200/60 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setSilhouetteMode('preset');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        silhouetteMode === 'preset'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Preset Models (S–XL)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setSilhouetteMode('upload');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        silhouetteMode === 'upload'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSilhouetteMode('camera');
                        startCamera();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        silhouetteMode === 'camera'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Use Camera</span>
                    </button>
                  </div>

                  {/* OPTION A: PRESET MANNEQUINS */}
                  {silhouetteMode === 'preset' && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span>Select a calibrated mannequin:</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {selectedMannequin.label} ({selectedMannequin.size})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {PRESET_MANNEQUINS.map((model) => {
                          const isSelected = selectedMannequin.id === model.id;
                          return (
                            <div
                              key={model.id}
                              onClick={() => {
                                setSelectedMannequin(model);
                                setSelectedSize(model.size);
                              }}
                              className={`group cursor-pointer rounded-xl border p-2 text-center transition-all ${
                                isSelected
                                  ? 'border-amber-600 bg-amber-500/10 shadow-md ring-2 ring-amber-500/30'
                                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                              }`}
                            >
                              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-neutral-100 dark:bg-neutral-800">
                                <img
                                  src={model.avatar}
                                  alt={model.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-amber-600 text-white' : 'bg-black/60 text-white'
                                }`}>
                                  {model.size}
                                </span>
                              </div>
                              <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                {model.label}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {model.height}
                              </div>
                              <div className="text-[9px] text-neutral-400 mt-0.5">
                                Bust {model.bust} • Waist {model.waist}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900/80 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                        <span className="text-base">👗</span>
                        <span>Preset mannequins feature authentic anatomical sizing to ensure 99% drape fidelity.</span>
                      </div>
                    </div>
                  )}

                  {/* OPTION B: UPLOAD FULL-BODY PHOTO */}
                  {silhouetteMode === 'upload' && (
                    <div>
                      {uploadedPhotoUrl ? (
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 mb-3 flex items-center justify-center">
                          <img
                            src={uploadedPhotoUrl}
                            alt="Uploaded Silhouette Preview"
                            className="h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              Photo Draped & Ready
                            </span>
                            <div className="flex gap-2">
                              <label className="text-[11px] font-semibold py-1 px-3 rounded bg-white/90 text-neutral-900 hover:bg-white cursor-pointer shadow">
                                Change
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setUploadedPhotoUrl(null)}
                                className="text-[11px] font-semibold py-1 px-3 rounded bg-rose-600/90 text-white hover:bg-rose-600 shadow cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="group flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-400 bg-neutral-50/50 dark:bg-neutral-900/50 cursor-pointer transition-all p-6 text-center mb-3">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                            Upload Full-Body Photo
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 max-w-xs">
                            Drag and drop or select your photo (JPG, PNG, WebP)
                          </span>
                          <span className="text-xs font-bold py-1.5 px-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm">
                            Browse Files
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* OPTION C: USE CAMERA */}
                  {silhouetteMode === 'camera' && (
                    <div className="flex flex-col items-center">
                      <div className="relative aspect-[4/3] w-full max-w-md rounded-xl overflow-hidden bg-black mb-3 border border-neutral-800 flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={captureCameraPhoto}
                          disabled={!isCameraActive}
                          className="py-2 px-6 rounded-lg bg-gradient-to-r from-amber-600 to-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          📸 Snap Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Try-On Trigger Action Bar */}
                <div className="mt-6 pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={runLiveSimulation}
                    disabled={silhouetteMode === 'upload' && !uploadedPhotoUrl}
                    className="w-full relative overflow-hidden group py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-900 via-rose-900 to-amber-700 text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-rose-950/25 border border-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform ease-out pointer-events-none" />
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Generate Virtual Fit →</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================= STAGE 2: 1.5s SCAN EFFECT LOADER ================= */}
          {stage === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              
              {/* Center Stage Card with Glowing Laser Light Bar */}
              <div className="relative aspect-[3/4] w-48 rounded-xl overflow-hidden bg-neutral-900 shadow-2xl border border-amber-500/40 mb-6">
                <img
                  src={
                    silhouetteMode === 'upload' && uploadedPhotoUrl
                      ? uploadedPhotoUrl
                      : selectedMannequin.avatar
                  }
                  alt="Scanning Model"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Garment Blend Overlay */}
                <img
                  src={activeGarment.image}
                  alt="Garment Overlay"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-75"
                />

                {/* 1.5-Second Glowing Laser Light Bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_15px_4px_rgba(251,191,36,0.8)] animate-pulse"
                  style={{
                    top: `${scanProgress}%`,
                    transition: 'top 0.4s ease-out'
                  }}
                />
              </div>

              <h4 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {scanStatusText}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Harmonizing anatomical drape physics & textile fall
              </p>

              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ================= STAGE 3: RESULT COMPARISON SLIDER & CONTROLS ================= */}
          {stage === 'simulation' && (
            <div className="flex flex-col items-center">
              
              {/* Header Badge Row */}
              <div className="w-full flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Drape Simulation Complete</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <span>Size: <strong className="text-amber-600">{selectedSize}</strong></span>
                  <span>•</span>
                  <span>Silhouette: <strong>{selectedMannequin.label}</strong></span>
                </div>
              </div>

              {/* Interactive Comparison Slider */}
              <div
                ref={sliderContainerRef}
                onMouseDown={() => setIsDragging(true)}
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[480px] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl cursor-ew-resize select-none border border-neutral-300 dark:border-neutral-800"
              >
                {/* AFTER: Simulated Fit Canvas Overlay */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={
                      silhouetteMode === 'upload' && uploadedPhotoUrl
                        ? uploadedPhotoUrl
                        : selectedMannequin.avatar
                    }
                    alt="Model Canvas"
                    className="w-full h-full object-cover"
                  />
                  {/* Clean mix-blend overlay of garment */}
                  <img
                    src={activeGarment.image}
                    alt="Simulated Fit Drape"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90"
                  />
                </div>
                <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold tracking-wider px-3 py-1 rounded-full uppercase border border-amber-500/30 flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulated Fit</span>
                </div>

                {/* BEFORE: Original Garment */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={activeGarment.image}
                    alt="Original Garment"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: sliderContainerRef.current?.clientWidth || '100%', maxWidth: 'none' }}
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full uppercase shadow-lg">
                    Original Garment
                  </div>
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center font-bold text-xs border border-neutral-200">
                    ⇄
                  </div>
                </div>
              </div>

              {/* Guide Note */}
              <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-amber-500" />
                <span>Drag handle left or right to compare original garment versus simulated fit.</span>
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setStage('selection');
                    setSliderPosition(50);
                  }}
                  className="py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another Model</span>
                </button>

                <div className="flex items-center gap-2.5">
                  {/* Share / Download Look */}
                  <button
                    type="button"
                    onClick={handleShareLook}
                    className="py-2.5 px-4 rounded-xl border border-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isSharedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Look Saved!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Download / Share Look</span>
                      </>
                    )}
                  </button>

                  {/* Add Fitted Size to Cart */}
                  <button
                    type="button"
                    onClick={handleAddFittedSizeToCart}
                    className="py-2.5 px-5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isAddedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added Size {selectedSize}!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add Fitted Size {selectedSize} to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AIVirtualDressingRoomModal;
