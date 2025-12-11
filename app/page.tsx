'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Activity, Bell, TrendingUp, Users, Zap, BarChart3, CheckCircle2, ArrowRight, X } from 'lucide-react';

// Composants réutilisables
function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
          {number}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-white mb-3">{value}</div>
      <div className="text-green-100 text-lg">{label}</div>
    </div>
  );
}

function TargetCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100 hover:border-green-200 transition-colors">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Nav - Seulement si non connecté */}
      {!user && (
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">YieldFood</div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalités</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Tarifs</a>
                <a href="#resources" className="text-gray-600 hover:text-gray-900 transition-colors">Ressources</a>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Connexion</Link>
                <Link 
                  href="/signup" 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Demander une démo
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Gérez vos stocks en temps réel.
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              YieldFood connecte vos ventes et vos commandes pour vous donner une vision instantanée de vos stocks et éviter les ruptures comme le gaspillage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/signup" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-center transition-colors inline-flex items-center justify-center gap-2"
              >
                Demander une démo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg font-semibold border border-gray-200 transition-colors"
                onClick={() => setShowDashboard(true)}
              >
                Voir un exemple de tableau de bord
              </button>
            </div>
          </div>
          
          {/* Mock Dashboard */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-semibold text-gray-900">Stocks en temps réel</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              {[
                { name: 'Tomates', stock: 85, status: 'ok' },
                { name: 'Poulet', stock: 45, status: 'ok' },
                { name: 'Mozzarella', stock: 12, status: 'warning' },
                { name: 'Basilic', stock: 5, status: 'critical' }
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{item.stock}kg</span>
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'ok' ? 'bg-green-500' :
                      item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                  <Bell className="w-4 h-4" />
                  <span>2 produits sous le seuil critique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ce que fait YieldFood */}
      <section id="features" className="bg-gray-50 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ce que fait YieldFood</h2>
            <p className="text-xl text-gray-600">Le cockpit de vos stocks en temps réel pour restaurants</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Activity}
              title="Vision en temps réel"
              description="Suivez en un coup d'œil les niveaux de stock par produit, par restaurant ou par point de vente."
            />
            <FeatureCard 
              icon={Bell}
              title="Alertes intelligentes"
              description="Soyez notifié avant une rupture ou un surstock, selon vos seuils critiques."
            />
            <FeatureCard 
              icon={TrendingUp}
              title="Prévisions de besoins"
              description="Anticipez vos commandes grâce à l'historique de ventes et à la saisonnalité."
            />
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
          <p className="text-xl text-gray-600">3 étapes simples pour reprendre le contrôle</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-12">
          <StepCard 
            number="1"
            title="Connectez vos outils"
            description="Intégrez votre caisse, inventaire et autres systèmes existants en quelques clics."
          />
          <StepCard 
            number="2"
            title="Suivez en temps réel"
            description="Accédez à un tableau de bord unique qui centralise tous vos stocks et points de vente."
          />
          <StepCard 
            number="3"
            title="Commandez en un clic"
            description="Recevez des recommandations intelligentes et commandez automatiquement vos produits en rupture chez vos fournisseurs référencés."
          />
        </div>
      </section>

      {/* Stats / Crédibilité */}
      <section className="bg-green-600 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <StatCard value="–30%" label="de gaspillage matière" />
            <StatCard value="–50%" label="de ruptures critiques" />
            <StatCard value="+5h" label="gagnées par semaine" />
          </div>
        </div>
      </section>

      {/* Pour qui */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Pour qui ?</h2>
          <p className="text-xl text-gray-600">Des solutions adaptées à chaque type de restauration</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <TargetCard 
            title="Restaurants à service rapide"
            description="Gérez vos flux tendus avec une vision en temps réel de vos stocks. Idéal pour les fast-foods et snacks."
          />
          <TargetCard 
            title="Groupes & chaînes"
            description="Centralisez la gestion de tous vos points de vente depuis un tableau de bord unique."
          />
          <TargetCard 
            title="Dark kitchens"
            description="Optimisez vos achats multi-enseignes et réduisez le gaspillage entre concepts."
          />
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Prêt à reprendre le contrôle de vos stocks ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez les restaurateurs qui ont déjà transformé leur gestion des stocks.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Demander une démo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="resources" className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-gray-900">YieldFood</div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">CGU</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-500">
            © 2025 YieldFood. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Modal Dashboard */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDashboard(false)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Exemple de tableau de bord</h3>
              <button 
                onClick={() => setShowDashboard(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="text-sm text-green-600 font-medium mb-2">Stock total</div>
                  <div className="text-3xl font-bold text-gray-900">147 kg</div>
                  <div className="text-sm text-gray-600 mt-1">+12% vs semaine dernière</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="text-sm text-orange-600 font-medium mb-2">Alertes actives</div>
                  <div className="text-3xl font-bold text-gray-900">5</div>
                  <div className="text-sm text-gray-600 mt-1">2 produits en rupture</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-sm text-blue-600 font-medium mb-2">Économies</div>
                  <div className="text-3xl font-bold text-gray-900">€842</div>
                  <div className="text-sm text-gray-600 mt-1">Ce mois-ci</div>
                </div>
              </div>

              {/* Stock Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Stocks en temps réel
                  </h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { name: 'Tomates cerises', stock: 85, unit: 'kg', status: 'ok', supplier: 'Grand Frais' },
                    { name: 'Poulet fermier', stock: 45, unit: 'kg', status: 'ok', supplier: 'Auchan' },
                    { name: 'Mozzarella di Bufala', stock: 12, unit: 'kg', status: 'warning', supplier: 'Monoprix' },
                    { name: 'Basilic frais', stock: 5, unit: 'kg', status: 'critical', supplier: 'Biocoop' },
                    { name: 'Huile d\'olive', stock: 28, unit: 'L', status: 'ok', supplier: 'Carrefour' },
                    { name: 'Farine T55', stock: 8, unit: 'kg', status: 'warning', supplier: 'Leclerc' },
                  ].map((item) => (
                    <div key={item.name} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">Fournisseur: {item.supplier}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-mono font-semibold text-gray-900">{item.stock} {item.unit}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'ok' ? 'bg-green-500' :
                          item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <Bell className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-red-900">Rupture critique</div>
                    <div className="text-sm text-red-700">Basilic frais sous le seuil minimum (5kg restant)</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-yellow-900">Stock faible</div>
                    <div className="text-sm text-yellow-700">Mozzarella di Bufala - Recommandation: commander 20kg</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-green-600 text-white rounded-lg p-6 text-center">
                <h4 className="text-xl font-bold mb-2">Prêt à optimiser votre gestion ?</h4>
                <p className="mb-4 text-green-100">Commencez gratuitement dès aujourd'hui</p>
                <Link 
                  href="/signup"
                  className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Créer mon compte
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
