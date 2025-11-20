'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Bienvenue sur <span className="text-green-600">YieldFood</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Votre plateforme complète de gestion et prévision des stocks alimentaires.
            Optimisez vos ressources et réduisez le gaspillage.
          </p>
          
          {!loading && !user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="bg-white hover:bg-gray-50 text-green-600 px-8 py-4 rounded-lg font-bold text-lg border-2 border-green-600 transition-colors shadow-lg"
              >
                Se connecter
              </Link>
            </div>
          )}
          
          {!loading && user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/stocks"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
              >
                📦 Accéder à mes stocks
              </Link>
              <Link
                href="/recipes/new"
                className="bg-white hover:bg-gray-50 text-green-600 px-8 py-4 rounded-lg font-bold text-lg border-2 border-green-600 transition-colors shadow-lg"
              >
                📝 Entrer une nouvelle recette
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Suivi des ventes
            </h3>
            <p className="text-gray-600">
              Analysez vos performances de vente en temps réel et identifiez les tendances.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Gestion des commandes
            </h3>
            <p className="text-gray-600">
              Optimisez vos commandes et maintenez des stocks adaptés à votre activité.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🔮</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Prévisions intelligentes
            </h3>
            <p className="text-gray-600">
              Anticipez la demande grâce à l'intelligence artificielle et évitez le gaspillage.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Pourquoi YieldFood ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">-30%</div>
              <p className="text-gray-600">Réduction du gaspillage alimentaire</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">+25%</div>
              <p className="text-gray-600">Amélioration de la rentabilité</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <p className="text-gray-600">Précision des prévisions</p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        {!loading && !user && (
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Prêt à optimiser votre gestion ?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Rejoignez YieldFood dès aujourd'hui et transformez votre business.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
