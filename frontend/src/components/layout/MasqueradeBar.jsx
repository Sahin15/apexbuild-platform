import { useEffect, useState } from 'react';

export default function MasqueradeBar() {
  const [isMasquerading, setIsMasquerading] = useState(false);
  const [tenantName, setTenantName] = useState('Tenant Workspace');

  useEffect(() => {
    if (localStorage.getItem('originalToken')) {
      setIsMasquerading(true);
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        setTenantName(u?.organizationId?.name || u?.name || 'Tenant Workspace');
      } catch (e) {}
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
      window.location.href = '/superadmin/business-accounts?tab=workspaces';
    }
  };

  if (!isMasquerading) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white px-5 py-2.5 rounded-full shadow-2xl border border-indigo-400/40 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-bold text-xs tracking-wide">
          👀 Inspecting Workspace: <span className="text-amber-300 font-extrabold">{tenantName}</span>
        </span>
      </div>
      <button 
        onClick={handleReturn}
        className="bg-white text-indigo-950 px-3.5 py-1 rounded-full text-xs font-black hover:bg-slate-100 transition-all shadow-sm"
      >
        Exit to Superadmin
      </button>
    </div>
  );
}
