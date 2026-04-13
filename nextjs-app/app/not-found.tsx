import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-text">Page Not Found</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-text-inverse rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
