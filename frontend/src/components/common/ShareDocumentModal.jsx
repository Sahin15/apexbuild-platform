import { useState } from 'react';
import { 
  X, MessageCircle, Printer, Copy, Check, Share2, 
  Send, Phone, FileText, ExternalLink, Download 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { openWhatsAppDirect, cleanPhoneNumber } from '../../utils/whatsappShare';
import haptics from '../../utils/haptics';

export default function ShareDocumentModal({
  isOpen,
  onClose,
  title = 'Share Document',
  documentNumber = '',
  recipientName = '',
  initialPhone = '',
  whatsappText = '',
  onPrint = null,
  onDownloadPdf = null,
  customBadge = 'OFFICIAL DOCUMENT'
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSendWhatsApp = () => {
    haptics.selection();
    openWhatsAppDirect(whatsappText, phoneNumber);
    toast.success('Opening WhatsApp...');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      haptics.success();
      toast.success('Formatted text copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: whatsappText
        });
        haptics.success();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">{title}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-200 text-slate-700">
                  {customBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {documentNumber ? `Doc: #${documentNumber} • ` : ''}{recipientName || 'Direct Share'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Phone Input */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Recipient WhatsApp / Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Leaving the number blank will open WhatsApp so you can pick any chat or group.
            </p>
          </div>

          {/* Formatted Message Preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Message Preview
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800 select-all shadow-inner">
              {whatsappText}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              title="Print document or thermal receipt"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full sm:w-auto py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
          )}

          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              title="More sharing options"
            >
              <Share2 className="w-4 h-4" />
              <span className="sm:hidden">More Options</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
