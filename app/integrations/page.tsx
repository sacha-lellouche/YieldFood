'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Zap } from 'lucide-react'

const posIntegrations = [
  {
    name: 'Lightspeed',
    logo: '/logos/lightspeed.png',
    status: 'active',
    description: 'Synchronisation automatique des ventes'
  },
  {
    name: 'Zettle Go',
    logo: '/logos/zettle.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'Zelty',
    logo: '/logos/zelty.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'Tiller',
    logo: '/logos/tiller.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'TheFork Manager',
    logo: '/logos/thefork.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'Tactill',
    logo: '/logos/tactill.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'SumUp Caisse',
    logo: '/logos/sumup.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'Qonto',
    logo: '/logos/qonto.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: "L'Addition",
    logo: '/logos/laddition.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'Innovorder',
    logo: '/logos/innovorder.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  },
  {
    name: 'iKentoo',
    logo: '/logos/ikentoo.png',
    status: 'coming-soon',
    description: 'Bientôt disponible'
  }
]

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/consommations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔌 Connexions API</h1>
            <p className="text-gray-600 mt-1">
              Connectez votre logiciel de caisse à YieldFood
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Synchronisation automatique</CardTitle>
                <CardDescription className="text-base mt-1">
                  Comment fonctionne notre connexion API ?
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-lg leading-relaxed">
              Avec notre connexion API, nous récupérons automatiquement les données issues de votre logiciel de caisse. 
              Vous n'avez plus qu'à valider les différentes consommations, et <span className="font-semibold text-purple-700">YieldFood se charge d'actualiser vos différents niveaux de stocks</span>.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Récupération auto</h3>
                  <p className="text-sm text-gray-600">Vos ventes sont importées en temps réel</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Validation simple</h3>
                  <p className="text-sm text-gray-600">Vérifiez et validez en un clic</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Stocks à jour</h3>
                  <p className="text-sm text-gray-600">Inventaire actualisé automatiquement</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Logiciels de caisse compatibles</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posIntegrations.map((pos) => (
              <Card 
                key={pos.name}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  pos.status === 'active' 
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' 
                    : 'border-gray-200 bg-white opacity-75'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    {pos.status === 'active' && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </span>
                      </div>
                    )}
                    {pos.status === 'coming-soon' && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Bientôt
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-20 flex items-center justify-center mb-3 bg-white rounded-lg p-3">
                    {/* Placeholder for logo - using text for now */}
                    <div className="text-2xl font-bold text-gray-400">{pos.name}</div>
                  </div>
                  <CardTitle className="text-center text-lg">{pos.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">{pos.description}</p>
                  {pos.status === 'active' && (
                    <Button 
                      className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      onClick={() => router.push('/lightspeed-monitoring')}
                    >
                      Configurer
                    </Button>
                  )}
                  {pos.status === 'coming-soon' && (
                    <Button 
                      className="w-full mt-3"
                      variant="outline"
                      disabled
                    >
                      Bientôt disponible
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
