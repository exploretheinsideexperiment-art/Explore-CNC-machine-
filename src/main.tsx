import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent sandboxed iframe environment errors from crashing the page
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('ServiceWorker') ||
      msg.includes('sandboxed') ||
      msg.includes('SecurityError') ||
      msg.includes('failed to connect to websocket')
    ) {
      event.preventDefault();
    }
  });

  // Safe service worker registration for PWA installability
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
  ) {
    window.addEventListener('load', () => {
      const swUrl = './service-worker.js';
      navigator.serviceWorker
        .register(swUrl, { scope: './' })
        .then((reg) => {
          console.log('PWA ServiceWorker registered successfully, scope:', reg.scope);
        })
        .catch((err) => {
          // Fallback to sw.js if service-worker.js had any issue
          navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
        });
    });
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Explore CNC caught component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <h2 className="text-xl font-bold text-cyan-400 mb-2">Explore CNC Recovered</h2>
            <p className="text-sm text-slate-400 mb-4">
              An unexpected display glitch occurred. The state has been protected.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold text-sm rounded-lg hover:bg-cyan-400 transition"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
