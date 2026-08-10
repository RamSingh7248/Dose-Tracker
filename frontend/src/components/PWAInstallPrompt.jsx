import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem('dosetracker_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('dosetracker_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-999 animate-fade-in-up p-4 rounded-2xl shadow-2xl flex flex-col gap-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)',
        boxShadow: 'var(--shadow-glow), 0 20px 50px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Smartphone size={24} color="white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              Install DoseTracker
              <Sparkles size={14} className="text-amber-400" />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Add to Home Screen for fast, offline access.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleInstall}
          className="btn-primary flex-1 text-xs font-semibold py-2.5 flex items-center justify-center gap-2 rounded-xl"
        >
          <Download size={16} />
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="btn-secondary text-xs font-medium py-2.5 px-4 rounded-xl text-gray-400"
        >
          Later
        </button>
      </div>
    </div>
  );
}
