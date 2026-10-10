import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Camera, 
  RotateCcw, 
  Check, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  Image as ImageIcon, 
  AlertCircle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import haptics from '../../utils/haptics';
import { compressImage, formatBytes } from '../../utils/imageCompressor';

/**
 * CameraPhotoCaptureModal
 * High-performance mobile-first camera capture modal with live viewfinder,
 * camera switcher, and instant client-side WebP/JPEG compression.
 */
export default function CameraPhotoCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Field Photo',
  subtitle = 'Align photo inside the viewfinder frame',
  instructionGuide = 'Hold steady and ensure good lighting',
  aspectRatio = 'standard', // 'standard' (4:3), 'square' (1:1), 'receipt' (16:9 tall)
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78
}) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Default back camera
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Stop video stream helper
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Check for multiple video input devices (front/back cameras)
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {});
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (mode = facingMode) => {
    setCameraError(null);
    stopStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch support on active video track
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      setHasTorch(Boolean(capabilities?.torch));
      setIsTorchOn(false);
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings or choose a photo from your gallery.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can still select or upload a photo.');
      } else {
        setCameraError('Unable to start live camera. You can capture or pick a photo using file upload.');
      }
    }
  }, [facingMode, stopStream]);

  // Handle open/close modal lifecycle
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedPhoto(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip front/back camera
  const handleToggleCamera = () => {
    haptics.impact('light');
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const newState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: newState }]
      });
      setIsTorchOn(newState);
      haptics.impact('light');
    } catch (err) {
      toast.error('Torch could not be activated');
    }
  };

  // Capture frame from live video
  const handleShutterClick = async () => {
    if (!videoRef.current || isProcessing) return;
    haptics.impact('heavy');
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const result = await compressImage(video, {
        maxWidth,
        maxHeight,
        quality,
        format: 'image/webp',
        fileName: `camera_${Date.now()}.webp`
      });

      setCapturedPhoto(result);
      stopStream(); // Freeze and conserve battery
    } catch (err) {
      console.error('Shutter capture failed:', err);
      toast.error('Failed to capture photo');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle fallback file input selection (works on desktop / denied permissions)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    haptics.impact('medium');

    try {
      const result = await compressImage(file, {
        maxWidth,
        maxHeight,
        quality,
        format: 'image/webp',
        fileName: file.name
      });

      setCapturedPhoto(result);
      stopStream();
    } catch (err) {
      toast.error('Failed to compress image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Retake photo
  const handleRetake = () => {
    haptics.impact('light');
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  // Confirm photo
  const handleConfirm = () => {
    if (!capturedPhoto) return;
    haptics.impact('medium');
    onCapture(capturedPhoto);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md bg-slate-900 text-white sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Hidden Native File Input Fallback */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
          className="hidden" 
        />

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold tracking-wide text-white drop-shadow-md flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              {title}
            </h3>
            <span className="text-[11px] text-slate-300 drop-shadow line-clamp-1">
              {subtitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Flash/Torch Toggle */}
            {hasTorch && !capturedPhoto && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-full transition-all ${
                  isTorchOn 
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30' 
                    : 'bg-black/40 text-slate-300 hover:text-white backdrop-blur-md'
                }`}
                title="Toggle Flash"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                haptics.impact('light');
                stopStream();
                onClose();
              }}
              className="p-2 text-slate-300 hover:text-white rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder & Preview Viewport */}
        <div className="relative flex-1 flex items-center justify-center bg-black min-h-[360px] sm:min-h-[460px] overflow-hidden">
          
          {/* Active Camera Video Feed */}
          {!capturedPhoto && !cameraError && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Frame / Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl border-2 border-emerald-400/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Target Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Center Target Mark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border border-emerald-400/30 rounded-full" />
                  </div>
                </div>

                {/* Instruction Banner */}
                <div className="mt-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-slate-200 font-medium tracking-wide">
                  {instructionGuide}
                </div>
              </div>
            </>
          )}

          {/* Captured Preview View */}
          {capturedPhoto && (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <img
                src={capturedPhoto.dataUrl}
                alt="Captured Preview"
                className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700"
              />

              {/* Compression Badge */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-1.5 border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimized: {formatBytes(capturedPhoto.compressedBytes)}</span>
                {capturedPhoto.savingsPercent > 0 && (
                  <span className="opacity-80 text-[11px]">(-{capturedPhoto.savingsPercent}%)</span>
                )}
              </div>
            </div>
          )}

          {/* Camera Error / Permission Denied Fallback UI */}
          {cameraError && !capturedPhoto && (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-xs">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Camera Offline</p>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                Select Photo from Device
              </button>
            </div>
          )}

          {/* Processing / Compression Loader */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 space-y-2">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-medium text-slate-200">Compressing high-res photo...</p>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-5 bg-slate-950 border-t border-slate-800/80">
          {!capturedPhoto ? (
            <div className="flex items-center justify-around">
              {/* Gallery Pick Button */}
              <button
                type="button"
                onClick={() => {
                  haptics.impact('light');
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                title="Upload from gallery"
              >
                <div className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-full">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium tracking-tight">Gallery</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleShutterClick}
                disabled={Boolean(cameraError) || isProcessing}
                className={`relative p-1 rounded-full border-4 border-white/80 active:scale-95 transition-all shadow-xl ${
                  cameraError ? 'opacity-40 cursor-not-allowed' : 'hover:border-emerald-400'
                }`}
                title="Take Photo"
              >
                <div className="w-16 h-16 bg-white hover:bg-emerald-400 rounded-full flex items-center justify-center transition-colors">
                  <Camera className="w-7 h-7 text-slate-900" />
                </div>
              </button>

              {/* Switch Camera Front/Back Button */}
              <button
                type="button"
                onClick={handleToggleCamera}
                disabled={Boolean(cameraError)}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                title="Switch camera"
              >
                <div className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-full">
                  <FlipHorizontal className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium tracking-tight">Flip</span>
              </button>
            </div>
          ) : (
            /* Action Buttons for Captured Photo */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                Use Photo ({formatBytes(capturedPhoto.compressedBytes)})
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
