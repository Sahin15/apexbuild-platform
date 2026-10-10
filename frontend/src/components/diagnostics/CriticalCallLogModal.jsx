import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Phone, PhoneCall, CheckCircle2, UserCheck, ShieldAlert, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CriticalCallLogModal = ({ isOpen, onClose, alert, onSuccess }) => {
  const [communicatedTo, setCommunicatedTo] = useState('');
  const [communicatedToRole, setCommunicatedToRole] = useState('Referring Doctor');
  const [communicatedPhone, setCommunicatedPhone] = useState('');
  const [readBackConfirmed, setReadBackConfirmed] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (alert) {
      setCommunicatedTo(alert.order?.referringDoctor?.name || alert.patient?.name || 'Dr. S. K. Mukherjee');
      setCommunicatedToRole('Referring Doctor');
      setCommunicatedPhone(alert.communicatedPhone || alert.patient?.phone || '');
      setReadBackConfirmed(true);
      setClinicalNotes('');
    }
  }, [alert]);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communicatedTo.trim()) {
      return toast.error('Please enter the name of the person notified');
    }
    if (!readBackConfirmed) {
      return toast.error('NABL protocol requires verbal read-back confirmation');
    }

    try {
      setSubmitting(true);
      const res = await api.patch(`/diagnostics/alerts/${alert._id}/communicate`, {
        communicatedTo,
        communicatedToRole,
        communicatedPhone,
        readBackConfirmed,
        clinicalNotes
      });

      toast.success('Telephonic communication logged under NABL standard protocol!');
      if (onSuccess) {
        onSuccess(res.data.data.alert);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log critical call');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Urgent Header */}
        <div className="px-6 py-4 border-b border-rose-200 flex justify-between items-center bg-gradient-to-r from-rose-600 to-red-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold leading-tight">Critical Panic Value Call Log</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                  {alert.alertNumber}
                </span>
              </div>
              <p className="text-xs text-rose-100">Statutory NABL Telephonic Notification Protocol</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Critical Value Summary Banner */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                  CRITICAL / PANIC VALUE DETECTED
                </span>
                <h3 className="text-lg font-black text-rose-950 mt-0.5">
                  {alert.parameterName}: <span className="underline decoration-rose-500">{alert.observedValue} {alert.unit}</span>
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-600 text-white animate-pulse">
                PANIC ALERT
              </span>
            </div>

            <div className="text-xs text-rose-900 border-t border-rose-200 pt-2 flex flex-col gap-0.5">
              <p><strong>Patient:</strong> {alert.patient?.firstName} {alert.patient?.lastName} ({alert.patient?.patientId || 'PID'})</p>
              <p><strong>Test:</strong> {alert.test?.name}</p>
              <p><strong>Panic Threshold:</strong> {alert.criticalThreshold}</p>
            </div>
          </div>

          {/* Person Notified & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Doctor / Person Notified *
              </label>
              <input
                type="text"
                required
                value={communicatedTo}
                onChange={(e) => setCommunicatedTo(e.target.value)}
                placeholder="e.g. Dr. S. K. Mukherjee"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Role *
              </label>
              <select
                value={communicatedToRole}
                onChange={(e) => setCommunicatedToRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-rose-500"
              >
                <option value="Referring Doctor">Referring Doctor</option>
                <option value="Treating Physician">Treating Physician</option>
                <option value="Patient Attendant">Patient Attendant</option>
                <option value="Ward Sister">Ward Sister / Nurse</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Contact Phone Number *</span>
              {communicatedPhone && (
                <a 
                  href={`tel:${communicatedPhone}`}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              )}
            </label>
            <input
              type="text"
              required
              value={communicatedPhone}
              onChange={(e) => setCommunicatedPhone(e.target.value)}
              placeholder="e.g. +91 98301 22334"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Mandatory NABL Verbal Read-Back Confirmation */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={readBackConfirmed}
                onChange={(e) => setReadBackConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300 rounded cursor-pointer"
              />
              <div className="text-xs text-amber-950">
                <span className="font-bold block">Verbal Read-Back Confirmed (NABL Standard) *</span>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  The recipient has verbally repeated back the patient demographics, test name, parameter, and exact panic numerical value.
                </span>
              </div>
            </label>
          </div>

          {/* Clinical Advice / Attending Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physician Response & Clinical Directions
            </label>
            <textarea
              rows="2"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Physician acknowledged; patient advised emergency ward admission for immediate platelet transfusion."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 font-medium"
            />
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
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Logging...' : 'Confirm NABL Communication'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriticalCallLogModal;
