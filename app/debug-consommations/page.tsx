'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Wrench, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DebugConsommationsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFixIngredients = async () => {
    if (!confirm('Voulez-vous réparer automatiquement les liens entre les recettes et les ingrédients ?')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/recipes/fix-ingredients', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        const error = await response.json()
        setResult({ success: false, error: error.error || 'Erreur inconnue' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setResult({ success: false, error: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/recipes"
            className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            ← Retour aux recettes
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-orange-600" />
              Outils de Maintenance
            </CardTitle>
            <CardDescription>
              Outils pour diagnostiquer et réparer les problèmes de consommations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problème diagnostiqué */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Problème identifié
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Les ingrédients des recettes ne sont pas liés au catalogue d'ingrédients, 
                ce qui empêche le système de calculer correctement les impacts sur les stocks.
              </p>
              <p className="text-sm text-blue-800">
                <strong>Solution :</strong> Utiliser l'outil de réparation ci-dessous pour 
                lier automatiquement les ingrédients des recettes avec le catalogue.
              </p>
            </div>

            {/* Outil de réparation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Réparer les liens recettes → ingrédients
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Cet outil va automatiquement associer les ingrédients de vos recettes 
                avec les ingrédients de votre catalogue en se basant sur le nom et l'unité.
              </p>
              
              <Button
                onClick={handleFixIngredients}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réparation en cours...
                  </>
                ) : (
                  <>
                    <Wrench className="mr-2 h-4 w-4" />
                    Réparer maintenant
                  </>
                )}
              </Button>
            </div>

            {/* Résultats */}
            {result && (
              <div className={`rounded-lg p-4 border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {result.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">
                        Réparation réussie !
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm text-green-800">
                      <p>✅ {result.fixed} ingrédient(s) lié(s) au catalogue</p>
                      
                      {result.missing > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-900 mb-2">
                            ⚠️ {result.missing} ingrédient(s) non trouvé(s) dans le catalogue
                          </p>
                          <p className="text-xs text-yellow-800 mb-2">
                            Ces ingrédients doivent être ajoutés manuellement au catalogue :
                          </p>
                          <ul className="text-xs text-yellow-800 list-disc list-inside">
                            {result.missingIngredients?.slice(0, 10).map((ing: any, i: number) => (
                              <li key={i}>{ing.name} ({ing.unit})</li>
                            ))}
                            {result.missingIngredients?.length > 10 && (
                              <li>... et {result.missingIngredients.length - 10} autre(s)</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Erreur</h3>
                    </div>
                    <p className="text-sm text-red-800">{result.error}</p>
                  </>
                )}
              </div>
            )}

            {/* Instructions après réparation */}
            {result?.success && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Prochaines étapes
                </h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>
                    Si des ingrédients manquent au catalogue, ajoutez-les depuis la page 
                    <Link href="/stock-management" className="text-orange-600 hover:underline ml-1">
                      Gestion des Stocks
                    </Link>
                  </li>
                  <li>
                    Une fois les ingrédients ajoutés, relancez cet outil de réparation
                  </li>
                  <li>
                    Pour les nouvelles recettes, utilisez toujours l'autocomplétion pour 
                    sélectionner les ingrédients du catalogue
                  </li>
                  <li>
                    Testez vos consommations depuis la page 
                    <Link href="/consommations" className="text-orange-600 hover:underline ml-1">
                      Mes Consommations
                    </Link>
                  </li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Pourquoi ai-je besoin de cet outil ?
              </h4>
              <p>
                Pour que le système puisse déduire automatiquement les stocks lorsque vous 
                déclarez une consommation, chaque ingrédient de vos recettes doit être lié 
                à un ingrédient du catalogue (avec un stock).
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Que fait l'outil de réparation ?
              </h4>
              <p>
                Il parcourt toutes vos recettes et essaie de faire correspondre automatiquement 
                les ingrédients avec ceux de votre catalogue en comparant les noms et les unités.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Comment éviter ce problème à l'avenir ?
              </h4>
              <p>
                Lors de la création ou modification de recettes, utilisez toujours 
                l'autocomplétion pour sélectionner les ingrédients depuis le catalogue 
                plutôt que de les saisir manuellement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
