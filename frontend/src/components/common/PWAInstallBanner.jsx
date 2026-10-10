import React, { useState } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Check } from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall';
import { useBrandTheme } from '../../context/ThemeContext';

export const PWAInstallBanner = ({ className = '' }) => {
  const { isInstallable, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const { osConfig, primaryColor } = useBrandTheme();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      setIsInstalling(true);
      await promptInstall();
      setIsInstalling(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${className}`}
        role="alert"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${primaryColor}25`, border: `1px solid ${primaryColor}50` }}
            >
              <Smartphone className="w-5 h-5" style={{ color: primaryColor || '#38bdf8' }} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Install {osConfig?.name || 'ApexBuild'} App
              </h4>
              <p className="text-xs font-medium text-slate-200 truncate">
                Faster mobile access & offline ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              style={{ backgroundColor: primaryColor || '#2563eb' }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? 'Instructions' : 'Install'}</span>
            </button>
            <button
              onClick={dismissPrompt}
              aria-label="Dismiss install banner"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instructions Sheet */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Install on iOS</h3>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Install <strong>{osConfig?.name || 'ApexBuild'}</strong> directly onto your iPhone/iPad home screen for instant full-screen app access:
            </p>

            <ol className="text-xs space-y-2.5 text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the Safari <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> at the bottom toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down the share sheet and tap <strong>'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right corner. The app icon will appear on your phone home screen!
                </span>
              </li>
            </ol>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowIOSModal(false);
                  dismissPrompt();
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
