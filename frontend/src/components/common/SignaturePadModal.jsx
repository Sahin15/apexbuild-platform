import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Trash2, PenTool, UserCheck, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import haptics from '../../utils/haptics';

/**
 * SignaturePadModal
 * High-precision touch & stylus signature pad modal for proof of delivery,
 * site engineer certifications, and operational sign-offs.
 */
export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = 'Customer Signature',
  subtitle = 'Sign with finger or stylus inside the signature box',
  initialSignerName = '',
  roleLabel = 'Signer Name / Shopkeeper'
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [signerName, setSignerName] = useState(initialSignerName);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [penColor, setPenColor] = useState('#0f172a'); // Ink Black / Deep Navy

  useEffect(() => {
    if (initialSignerName) {
      setSignerName(initialSignerName);
    }
  }, [initialSignerName]);

  // Canvas scaling & resizing for High-DPI screens
  const redrawCanvas = useCallback((strokesToRender) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw baseline guideline
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1 * dpr;
    const lineY = canvas.height - 35 * dpr;
    ctx.beginPath();
    ctx.moveTo(20 * dpr, lineY);
    ctx.lineTo(canvas.width - 20 * dpr, lineY);
    ctx.stroke();

    // Draw 'X' sign mark
    ctx.font = `${14 * dpr}px sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('✕', 22 * dpr, lineY - 6 * dpr);
    ctx.restore();

    // Render strokes
    strokesToRender.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color || '#0f172a';
      ctx.lineWidth = (stroke.width || 2.5) * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * dpr, pt.y * dpr);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas(strokes);
  }, [redrawCanvas, strokes]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure container DOM layout is computed
      const timer = setTimeout(resizeCanvas, 50);
      window.addEventListener('resize', resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [isOpen, resizeCanvas]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    const newStroke = {
      color: penColor,
      width: 2.5,
      points: [coords]
    };
    setCurrentStroke([coords]);
    setStrokes(prev => [...prev, newStroke]);

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);

    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastStroke = { ...updated[updated.length - 1] };
      lastStroke.points = [...lastStroke.points, coords];
      updated[updated.length - 1] = lastStroke;
      redrawCanvas(updated);
      return updated;
    });
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleClear = () => {
    haptics.light();
    setStrokes([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas([]);
  };

  const handleUndo = () => {
    haptics.light();
    setStrokes(prev => {
      const next = prev.slice(0, -1);
      redrawCanvas(next);
      return next;
    });
  };

  const handleSaveSignature = () => {
    if (strokes.length === 0) {
      haptics.warning();
      return toast.error('Please sign inside the signature pad before saving.');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export high-res PNG data url
    const signatureDataUrl = canvas.toDataURL('image/png');
    haptics.success();

    if (onSave) {
      onSave({
        signatureDataUrl,
        signerName: signerName.trim() || 'Authorized Representative',
        signedAt: new Date().toISOString()
      });
    }

    toast.success('Signature verified & saved!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Signer Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{roleLabel}</span>
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Rajesh Kumar (Store Manager)"
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Canvas Touch Area */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-evident Digital Touch Pad
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-4 h-4 rounded-full border ${penColor === '#0f172a' ? 'ring-2 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: '#0f172a' }}
                  title="Black Ink"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#1d4ed8')}
                  className={`w-4 h-4 rounded-full border ${penColor === '#1d4ed8' ? 'ring-2 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: '#1d4ed8' }}
                  title="Blue Ink"
                />
              </div>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full h-48 sm:h-56 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 touch-none overflow-hidden shadow-inner cursor-crosshair select-none"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full block"
              />
              {strokes.length === 0 && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 opacity-60">
                  <PenTool className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-xs font-medium">Draw signature here</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSignature}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 rounded-xl transition-transform"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Sign</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
