import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Users, Utensils, Heart, Gift, Briefcase, 
  Sparkles, CheckCircle2, Phone, Mail, ShieldCheck, ArrowRight, 
  MapPin, Coffee, AlertCircle, RefreshCw, Send, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const OCCASIONS = [
  { value: 'NONE', label: 'Casual Dining', icon: Coffee },
  { value: 'BIRTHDAY', label: 'Birthday Celebration 🎂', icon: Gift },
  { value: 'ANNIVERSARY', label: 'Anniversary Dinner 🥂', icon: Heart },
  { value: 'DATE_NIGHT', label: 'Romantic Date Night 🕯️', icon: Heart },
  { value: 'BUSINESS_DINNER', label: 'Corporate Meeting 💼', icon: Briefcase },
  { value: 'FAMILY_GATHERING', label: 'Family Feast 👨‍👩‍👧‍👦', icon: Users },
];

const DIETARY_OPTIONS = [
  { id: 'VEG', label: 'Pure Veg' },
  { id: 'NON_VEG', label: 'Non-Veg' },
  { id: 'JAIN', label: 'Jain / No Onion Garlic' },
  { id: 'VEGAN', label: 'Vegan' },
  { id: 'GLUTEN_FREE', label: 'Gluten Free' },
  { id: 'NUT_ALLERGY', label: 'Nut Allergy' },
  { id: 'SPICY_LOVER', label: 'Extra Spicy' },
  { id: 'LESS_OIL', label: 'Low Oil / Healthy' },
];

const TIME_SLOTS = [
  { time: '12:00', period: 'Lunch' },
  { time: '12:30', period: 'Lunch' },
  { time: '13:00', period: 'Lunch' },
  { time: '13:30', period: 'Lunch' },
  { time: '14:00', period: 'Lunch' },
  { time: '18:30', period: 'Dinner' },
  { time: '19:00', period: 'Dinner' },
  { time: '19:30', period: 'Dinner' },
  { time: '20:00', period: 'Dinner' },
  { time: '20:30', period: 'Dinner' },
  { time: '21:00', period: 'Dinner' },
  { time: '21:30', period: 'Dinner' }
];

export default function OnlineTableBooking() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: '2',
    reservationDate: todayStr,
    timeSlot: '20:00',
    specialOccasion: 'NONE',
    dietaryPreferences: ['NON_VEG'],
    guestNotes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.timeSlot) {
      toast.error('Please enter your name, phone number, and preferred time slot');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/restaurant/online-booking/public', {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        partySize: Number(form.partySize) || 2,
        reservationDate: form.reservationDate,
        timeSlot: form.timeSlot,
        specialOccasion: form.specialOccasion,
        dietaryPreferences: form.dietaryPreferences,
        guestNotes: form.guestNotes
      });

      if (res.data?.data?.reservation) {
        setSubmittedBooking(res.data.data.reservation);
        toast.success('Reservation request sent to the restaurant manager!');
      }
    } catch (err) {
      console.error('Online booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit online booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDietaryToggle = (tagId) => {
    setForm(prev => {
      const exists = prev.dietaryPreferences.includes(tagId);
      return {
        ...prev,
        dietaryPreferences: exists
          ? prev.dietaryPreferences.filter(t => t !== tagId)
          : [...prev.dietaryPreferences, tagId]
      };
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Brand Navbar */}
      <header className="border-b border-stone-800/80 bg-stone-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md">
              <Utensils className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Apex Gourmet Bistro
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Open for Booking
                </span>
              </h1>
              <p className="text-[11px] text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                Apex Luxury Plaza, Fine Dining Hall
              </p>
            </div>
          </div>

          <Link
            to="/restaurant/dashboard"
            className="text-xs font-semibold text-stone-400 hover:text-white px-3 py-1.5 rounded-lg border border-stone-800 hover:bg-stone-800 transition-colors"
          >
            Staff Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Booking Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {submittedBooking ? (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="bg-stone-900/80 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Booking Reference: {submittedBooking.reservationCode}
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                Reservation Request Received!
              </h2>
              <p className="text-sm text-stone-300 max-w-md mx-auto mt-2">
                Thank you, <b className="text-white">{submittedBooking.customerName}</b>. Your booking request for <b className="text-white">{submittedBooking.partySize} guests</b> on <b className="text-white">{new Date(submittedBooking.reservationDate).toLocaleDateString()} at {submittedBooking.timeSlot}</b> has been transmitted directly to our live manager console.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 max-w-md mx-auto text-xs text-left space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span>Status:</span>
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Awaiting Manager Approval
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Contact Phone:</span>
                <span className="text-white font-mono">{submittedBooking.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Confirmation Method:</span>
                <span className="text-emerald-400 font-medium">WhatsApp / SMS Notification</span>
              </div>
              {submittedBooking.guestNotes && (
                <div className="pt-2 border-t border-stone-700/60 text-stone-300 italic">
                  Note: "{submittedBooking.guestNotes}"
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSubmittedBooking(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors"
              >
                Book Another Table
              </button>

              <Link
                to="/restaurant/dashboard"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-900/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Alert on Restaurant Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* BOOKING FORM */
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="border-b border-stone-800 pb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Reserve Your Dining Experience
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Book a Table Online
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Instant confirmation directly routed to restaurant reception & maitre d'.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Date & Party Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Dining Date <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={form.reservationDate}
                    onChange={(e) => setForm(prev => ({ ...prev, reservationDate: e.target.value }))}
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Number of Guests (Pax) <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={form.partySize}
                    onChange={(e) => setForm(prev => ({ ...prev, partySize: e.target.value }))}
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Time Slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Select Seating Time Slot <span className="text-orange-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const isSelected = form.timeSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, timeSlot: slot.time }))}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-500 shadow-md font-bold'
                            : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:border-stone-500'
                        }`}
                      >
                        <div className="text-sm font-mono">{slot.time}</div>
                        <div className="text-[10px] text-stone-400 opacity-80">{slot.period}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Special Occasion */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Are You Celebrating Any Occasion?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OCCASIONS.map(occ => {
                    const isSelected = form.specialOccasion === occ.value;
                    return (
                      <button
                        key={occ.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, specialOccasion: occ.value }))}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-semibold'
                            : 'bg-stone-800/50 text-stone-400 border-stone-700/60 hover:text-stone-200'
                        }`}
                      >
                        {occ.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Dietary Requirements */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Dietary Preferences & Allergies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map(tag => {
                    const isSelected = form.dietaryPreferences.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleDietaryToggle(tag.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                            : 'bg-stone-800/60 text-stone-400 border-stone-700 hover:text-stone-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Guest Contact Details */}
              <div className="space-y-4 pt-2 border-t border-stone-800">
                <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Devika Sengupta"
                      value={form.customerName}
                      onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      WhatsApp / Mobile Number <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9830112233"
                      value={form.customerPhone}
                      onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Special Seating Requests / Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Quiet corner, high chair for toddler, window view table"
                    value={form.guestNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, guestNotes: e.target.value }))}
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-950/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Restaurant Manager...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Send Booking Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/60 py-4 text-center text-xs text-stone-500">
        Powered by ApexBuild Restaurant OS • Real-Time Table Reservation Engine
      </footer>
    </div>
  );
}
