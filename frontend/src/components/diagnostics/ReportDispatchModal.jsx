import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Phone, User, CheckCircle2, QrCode, FileText, ArrowUpRight, Copy } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReportDispatchModal = ({ isOpen, onClose, order, organization, onSuccess }) => {
  const [channel, setChannel] = useState('WHATSAPP');
  const [recipientType, setRecipientType] = useState('PATIENT');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const orgName = organization?.name || 'APEX CLINICAL DIAGNOSTICS & RESEARCH LAB';
  const orgPhone = organization?.phone || '+91 (033) 2450-8900';

  const patient = order?.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
  const doctorName = order?.referringDoctor?.name || 'Attending Doctor';
  const testNames = (order?.tests || []).map(t => t.test?.name || 'Test').join(', ');
  const downloadUrl = `https://apexdiagnostics.in/reports/download/${order?.orderId || 'ORD-0000'}?auth=apex2026`;

  useEffect(() => {
    if (order) {
      if (recipientType === 'PATIENT') {
        setRecipientPhone(patient.phone || '');
      } else {
        setRecipientPhone(order.referringDoctor?.phone || '');
      }
      setCustomNotes('');
    }
  }, [order, recipientType]);

  if (!isOpen || !order) return null;

  // Live constructed message
  const targetRecipient = recipientType === 'PATIENT' ? patientName : doctorName;
  const messagePreview = (
    `🏥 *${orgName.toUpperCase()}*\n\n` +
    `Dear *${targetRecipient}*,\n` +
    `Laboratory Investigation Report for Order *#${order.orderId}* (${patientName}) is now *VERIFIED* and ready for immediate download.\n\n` +
    `📋 *Tests Included:* ${testNames}\n` +
    `📥 *Download Official NABL PDF Report:*\n${downloadUrl}\n\n` +
    (customNotes.trim() ? `💬 *Lab Note:* ${customNotes}\n\n` : '') +
    `📞 *24/7 Lab Helpline:* ${orgPhone}\n` +
    `_Wishing you speedy recovery!_`
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messagePreview);
    toast.success('Message text copied to clipboard!');
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!recipientPhone.trim()) {
      return toast.error('Please enter a recipient phone number');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/diagnostics/dispatches', {
        orderId: order._id,
        recipientType,
        recipientPhone,
        channel,
        customMessage: messagePreview
      });

      const { dispatch, whatsappUrl } = res.data.data;

      // If WhatsApp, launch official WhatsApp Web / Mobile URL
      if (channel === 'WHATSAPP' && whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }

      toast.success(`Report dispatched via ${channel}!`);
      if (onSuccess) {
        onSuccess(dispatch);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Patient Report Dispatch Station</h2>
              <p className="text-xs text-emerald-100">{order.orderId} • {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleDispatch} className="p-6 space-y-4">
          
          {/* Channel & Recipient Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Dispatch Channel
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'WHATSAPP' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'SMS' 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Recipient
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRecipientType('PATIENT')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    recipientType === 'PATIENT' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('DOCTOR')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    recipientType === 'DOCTOR' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Ref Doctor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{recipientType === 'PATIENT' ? 'Patient Mobile Number' : 'Doctor Mobile Number'} *</span>
              <span className="text-[10px] text-slate-400">Include STD/Country Code if applicable</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 98301 22334"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Custom Lab Note (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Add Personal Note / Follow-up Instructions (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Please show report to your doctor within 48 hours"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Live Message Preview Box */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Live {channel} Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-300 p-4 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner max-h-44 overflow-y-auto">
              {messagePreview}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !recipientPhone.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {channel === 'WHATSAPP' ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>{submitting ? 'Launching...' : 'Send via WhatsApp Web/App'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send SMS Notification'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportDispatchModal;
