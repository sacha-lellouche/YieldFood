'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-bold text-green-600">🍽️ YieldFood</h1>
          </Link>
          
          <nav className="flex items-center gap-6">
            {loading ? (
              <div className="text-gray-500">Chargement...</div>
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
