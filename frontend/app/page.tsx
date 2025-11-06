'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test de connexion Supabase
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('_test').select('*').limit(1);
        setConnected(!error);
      } catch (err) {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-green-600">🍽️ YieldFood</h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loading ? '⏳ Checking...' : connected ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Bienvenue sur YieldFood
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Votre plateforme de gestion et prévision des stocks alimentaires
          </p>
          <div className="flex gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Commencer
            </button>
            <button className="bg-white hover:bg-gray-50 text-green-600 px-6 py-3 rounded-lg font-semibold border-2 border-green-600 transition-colors">
              En savoir plus
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Ventes</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-sm text-gray-500 mt-1">Transactions totales</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Commandes</h3>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-sm text-gray-500 mt-1">En cours</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm font-medium">Prévisions</h3>
              <span className="text-2xl">🔮</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-sm text-gray-500 mt-1">Modèles actifs</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center">
              <span className="text-4xl mb-2 block">📈</span>
              <p className="font-semibold text-gray-700">Voir les ventes</p>
            </button>
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center">
              <span className="text-4xl mb-2 block">🛒</span>
              <p className="font-semibold text-gray-700">Gérer les commandes</p>
            </button>
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center">
              <span className="text-4xl mb-2 block">🎯</span>
              <p className="font-semibold text-gray-700">Prévisions</p>
            </button>
            <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center">
              <span className="text-4xl mb-2 block">⚙️</span>
              <p className="font-semibold text-gray-700">Paramètres</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
