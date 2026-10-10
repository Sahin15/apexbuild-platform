import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, Flashlight, SwitchCamera, Sparkles, CheckCircle2, AlertCircle, Keyboard, Image as ImageIcon } from 'lucide-react';

/**
 * Play a high-pitch success chime using Web Audio API (zero external asset dependency)
 */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Trigger mobile haptic feedback tick
 */
function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch {}
}

export const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode or QR Code',
  subtitle = 'Point camera at the specimen tube, crate, or product barcode'
}) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const isScanningRef = useRef(false);

  // Initialize BarcodeDetector if available
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        const formats = [
          'code_128',
          'code_39',
          'ean_13',
          'ean_8',
          'qr_code',
          'upc_a',
          'upc_e'
        ];
        detectorRef.current = new window.BarcodeDetector({ formats });
      } catch (e) {
        console.warn('BarcodeDetector format error, using default detector:', e);
        try {
          detectorRef.current = new window.BarcodeDetector();
        } catch {}
      }
    }
  }, []);

  // Handle successful detection
  const handleDetected = useCallback((value) => {
    if (!value || isScanningRef.current === false) return;
    isScanningRef.current = false;
    setScannedResult(value);
    playBeep();
    triggerHaptic();

    setTimeout(() => {
      onScan(value);
      onClose();
    }, 600);
  }, [onScan, onClose]);

  // Scan loop using requestAnimationFrame
  const scanFrame = useCallback(async () => {
    if (!isScanningRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      if (isScanningRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
      return;
    }

    try {
      if (detectorRef.current) {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          if (rawValue) {
            handleDetected(rawValue);
            return;
          }
        }
      }
    } catch (e) {
      // Detection errors can occur on noisy frames; continue scanning
    }

    if (isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  }, [handleDetected]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setErrorMsg('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);
      isScanningRef.current = true;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack?.getCapabilities?.();
      setHasTorch(Boolean(capabilities?.torch));

      // Start scan loop
      scanFrame();
    } catch (err) {
      console.warn('Camera access failed:', err);
      setHasPermission(false);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Unable to open camera on this device. You can type the barcode manually below.'
      );
    }
  }, [facingMode, scanFrame]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
  }, []);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process uploaded image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (detectorRef.current) {
      try {
        const imageBitmap = await createImageBitmap(file);
        const barcodes = await detectorRef.current.detect(imageBitmap);
        if (barcodes && barcodes.length > 0) {
          handleDetected(barcodes[0].rawValue);
          return;
        }
      } catch (err) {
        console.warn('File barcode detect failed:', err);
      }
    }

    // Fallback if not detected from file
    setErrorMsg('No barcode recognized in the uploaded photo. Please type it manually.');
  };

  // Handle manual code submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetected(manualCode.trim());
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
        {/* Mobile Pull Handle */}
        <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-900">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">{title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col justify-center">
          {activeTab === 'camera' ? (
            <div className="flex flex-col items-center">
              {/* Camera Viewfinder */}
              <div className="relative w-full aspect-4/3 max-w-sm bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Scanning Reticle & Laser */}
                {isScanningRef.current && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Targeting Frame Box */}
                    <div className="relative w-3/4 h-3/5 border-2 border-indigo-400/80 rounded-xl shadow-lg">
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                      {/* Animated Laser Scan Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce duration-1000 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Scanned Success Overlay */}
                {scannedResult && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 animate-in zoom-in-95">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                    <p className="text-xs uppercase font-bold text-emerald-300">Code Recognized</p>
                    <p className="text-lg font-mono font-black text-white mt-1 break-all bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                      {scannedResult}
                    </p>
                  </div>
                )}

                {/* Error Banner inside Viewfinder */}
                {hasPermission === false && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-5">
                    <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-sm font-bold text-white">Camera Unavailable</p>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                    >
                      Switch to Manual Entry
                    </button>
                  </div>
                )}
              </div>

              {/* Viewfinder Controls */}
              <div className="flex items-center justify-center gap-3 mt-4 w-full">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      torchOn
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Flashlight className="w-4 h-4" />
                    <span>{torchOn ? 'Torch On' : 'Torch Off'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
                >
                  <SwitchCamera className="w-4 h-4" />
                  <span>Flip Camera</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            /* Manual Input Form */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Barcode Number / SKU / Sample ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. SPL-90214 or 8901030612345"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Type or paste the code directly, or use an external Bluetooth barcode gun.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Apply Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
