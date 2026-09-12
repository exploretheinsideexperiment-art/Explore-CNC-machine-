import React, { useEffect, useState } from 'react';
import {
  Download,
  Share,
  X,
  Smartphone,
  CheckCircle,
  ExternalLink,
  Laptop,
  Apple,
  Sparkles,
  WifiOff
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop' | 'apk'>('android');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed PWA or native APK container)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Auto-detect OS for default tab
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios');
    } else if (/android/.test(ua)) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowModal(false);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    setShowModal(true);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl || 'https://exploretheinsideexperiment-art.github.io/Explore-CNC-machine-/')}`;
  const githubActionsUrl = 'https://github.com/exploretheinsideexperiment-art/Explore-CNC-machine-/actions/workflows/build-apk.yml';

  if (isInstalled) {
    return (
      <span
        id="pwa-installed-badge"
        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-400 text-[11px] font-semibold"
        title="Explore CNC is installed and running in native standalone mode"
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Installed</span>
      </span>
    );
  }

  return (
    <>
      {/* Header Install Button */}
      <button
        type="button"
        id="btn-install-pwa-header"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 text-cyan-200 border border-cyan-500/50 rounded-lg text-xs font-semibold transition shadow-sm animate-pulse hover:animate-none"
        title="Install Explore CNC as Progressive Web App (PWA) on your Phone or PC"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>Install App</span>
      </button>

      {/* Interactive PWA Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Install Explore CNC (PWA)</h3>
                  <p className="text-[11px] text-slate-400">
                    Works offline • Native full-screen • Instant home screen access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 1-Click Trigger (if browser supported) */}
            {deferredPrompt && (
              <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-cyan-300">Ready to Install!</p>
                  <p className="text-slate-300 text-[11px]">Click below for native 1-tap installation</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      setIsInstalled(true);
                      setDeferredPrompt(null);
                      setShowModal(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Now</span>
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="mt-4 flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'android'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'ios'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'desktop'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('apk')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'apk'
                    ? 'bg-slate-800 text-emerald-300 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>APK File</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 space-y-3 text-xs">
              {activeTab === 'android' && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                  <h4 className="font-semibold text-sm text-cyan-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Install on Android (Chrome / Edge / Samsung Internet)</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed text-[12px]">
                    <li>
                      Open this URL in <strong>Google Chrome</strong> on your Android phone.
                    </li>
                    <li>
                      Tap the <strong>3 vertical dots (Menu)</strong> in the top-right corner of Chrome.
                    </li>
                    <li>
                      Tap <strong>&quot;Install app&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>).
                    </li>
                    <li>
                      Confirm by tapping <strong>Install</strong>.
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/50">
                    ✓ Explore CNC will now appear in your phone&apos;s app drawer with its own CNC icon and runs in 100% full-screen mode!
                  </p>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                  <h4 className="font-semibold text-sm text-cyan-300 flex items-center gap-2">
                    <Apple className="w-4 h-4 text-cyan-400" />
                    <span>Install on Apple iOS (Safari)</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed text-[12px]">
                    <li>
                      Open this website in <strong>Safari</strong> on your iPhone or iPad.
                    </li>
                    <li>
                      Tap the <strong>Share button</strong> (square icon with an arrow pointing up) at the bottom toolbar.
                    </li>
                    <li>
                      Scroll down the menu and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                    </li>
                    <li>
                      Tap <strong>&quot;Add&quot;</strong> in the top right corner.
                    </li>
                  </ol>
                  <p className="text-[11px] text-cyan-400 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-900/50">
                    ✓ Opens like a native iOS app without browser address bars!
                  </p>
                </div>
              )}

              {activeTab === 'desktop' && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                  <h4 className="font-semibold text-sm text-cyan-300 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span>Install on Windows, Mac, or Linux</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[12px]">
                    In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, look at the right side of the address bar at the top of your screen:
                  </p>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 flex items-center gap-3">
                    <Download className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-200">
                      Click the <strong>&quot;Install Explore CNC&quot; icon</strong> in your browser address bar.
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Or click the 3 dots in Chrome &rarr; <strong>&quot;Save and share&quot;</strong> &rarr; <strong>&quot;Install Explore CNC...&quot;</strong>
                  </p>
                </div>
              )}

              {activeTab === 'apk' && (
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                  <h4 className="font-semibold text-sm text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Native Android APK Package</span>
                  </h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    If you prefer a raw standalone `.apk` file instead of browser PWA installation:
                  </p>
                  <div className="space-y-2">
                    <a
                      href={githubActionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-750 rounded-lg border border-slate-700 transition"
                    >
                      <div>
                        <p className="font-bold text-slate-200 text-xs">GitHub Actions APK Builder</p>
                        <p className="text-[10px] text-slate-400">Automated Gradle build from repository</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </a>

                    <a
                      href={pwabuilderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-750 rounded-lg border border-slate-700 transition"
                    >
                      <div>
                        <p className="font-bold text-amber-300 text-xs">Microsoft PWABuilder (Instant APK)</p>
                        <p className="text-[10px] text-slate-400">Generates signed APK in 30 seconds</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* PWA Features Highlights */}
            <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-around text-center text-[10px] text-slate-400">
              <div className="flex flex-col items-center gap-1">
                <WifiOff className="w-4 h-4 text-cyan-400" />
                <span>Works Offline</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex flex-col items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Hardware USB/WiFi</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex flex-col items-center gap-1">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>Native Fullscreen</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

