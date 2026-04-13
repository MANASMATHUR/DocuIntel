'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-risk-high/10 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-risk-high" />
        </div>
        <h2 className="text-2xl font-semibold text-text">Something went wrong</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-text-inverse rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
