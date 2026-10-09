import { useEffect, useState } from 'react';

export default function MasqueradeBar() {
  const [isMasquerading, setIsMasquerading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('originalToken')) {
      setIsMasquerading(true);
    }
  }, []);

  const handleReturn = () => {
    const originalToken = localStorage.getItem('originalToken');
    const originalUser = localStorage.getItem('originalUser');
    if (originalToken && originalUser) {
      localStorage.setItem('token', originalToken);
      localStorage.setItem('user', originalUser);
      localStorage.removeItem('originalToken');
      localStorage.removeItem('originalUser');
      window.location.href = '/superadmin/business-accounts';
    }
  };

  if (!isMasquerading) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-bounce">
      <span className="font-bold text-sm">👀 You are currently impersonating a Tenant</span>
      <button 
        onClick={handleReturn}
        className="bg-white text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors"
      >
        Return to Super Admin
      </button>
    </div>
  );
}
