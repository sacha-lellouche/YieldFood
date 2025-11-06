'use client';

import AuthForm from '@/components/AuthForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-green-600 mb-2">🍽️ YieldFood</h1>
          </Link>
          <p className="text-gray-600">Créez votre compte gratuitement</p>
        </div>
        
        <AuthForm mode="signup" />
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-green-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
