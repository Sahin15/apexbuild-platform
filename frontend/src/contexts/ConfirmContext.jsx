import { createContext, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger', // danger or warning
    onConfirm: null,
    onCancel: null
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger',
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto ${confirmState.type === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <AlertTriangle className={`w-8 h-8 ${confirmState.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <h2 className="text-xl font-black text-center text-slate-800 mb-2">{confirmState.title}</h2>
              <p className="text-center text-slate-500 font-medium">{confirmState.message}</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={confirmState.onCancel}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                {confirmState.cancelText}
              </button>
              <button 
                onClick={confirmState.onConfirm}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-bold transition-colors shadow-sm ${
                  confirmState.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
