'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing connection...');
  const [platform, setPlatform] = useState('social media');

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const platform = searchParams.get('platform');

      // Check for errors first
      if (error) {
        setStatus('error');
        const errorMessages: Record<string, string> = {
          'api_key_not_configured': 'API key not configured on server',
          'missing_state': 'Missing state parameter',
          'invalid_or_expired_token': 'Connection token expired. Please try again.',
          'late_api_error': 'Late API error occurred',
          'connection_failed': 'Failed to connect to authentication service'
        };
        setMessage(errorMessages[error] || `Connection failed: ${error}`);
        return;
      }

      // Check for success
      if (success === 'true' && platform) {
        setPlatform(platform);
        setStatus('success');
        setMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected successfully!`);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        return;
      }

      // If neither error nor success, something went wrong
      setStatus('error');
      setMessage('Invalid callback parameters');
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-kinetic-mint animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-ghost-white mb-4">
              Connecting...
            </h1>
            <p className="text-ghost-white/60">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-ghost-white mb-4">
              Connected Successfully!
            </h1>
            <p className="text-ghost-white/60 mb-6">{message}</p>
            <p className="text-ghost-white/40 text-sm">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-ghost-white mb-4">
              Connection Failed
            </h1>
            <p className="text-ghost-white/60 mb-8">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full py-3"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SocialConnectCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center px-6">
          <div className="glass-card max-w-md w-full p-8 text-center">
            <Loader2 className="w-16 h-16 text-kinetic-mint animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-ghost-white mb-4">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
