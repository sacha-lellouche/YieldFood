'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { RecipeWithCount } from '@/types/recipe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, Trash2, Eye, Clock, Users, Package, Upload, Sparkles } from 'lucide-react'
import Link from 'next/link'
import MenuUploadDialog from '@/components/MenuUploadDialog'

export default function RecipesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [recipes, setRecipes] = useState<RecipeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMenuUpload, setShowMenuUpload] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchRecipes()
    }
  }, [user, search])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/recipes', window.location.origin)
      if (search) {
        url.searchParams.append('search', search)
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setRecipes(data)
      } else {
        console.error('Erreur lors de la récupération des recettes')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      return
    }

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRecipes(recipes.filter((recipe) => recipe.id !== id))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleCleanupDuplicates = async () => {
    if (!confirm('Supprimer automatiquement les recettes en double avec 0 ingrédients ?')) {
      return
    }

    try {
      setCleaningUp(true)
      const response = await fetch('/api/recipes/cleanup-duplicates', {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchRecipes() // Recharger la liste
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du nettoyage')
    } finally {
      setCleaningUp(false)
    }
  }

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                    <ChefHat className="h-8 w-8" />
                    Mes Recettes
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Créez et gérez vos recettes avec suggestion d'ingrédients par IA
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    onClick={handleCleanupDuplicates}
                    disabled={cleaningUp}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {cleaningUp ? 'Nettoyage...' : 'Nettoyer les doublons'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      console.log('Bouton cliqué, ouverture du dialog')
                      setShowMenuUpload(true)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Uploader ma carte
                  </Button>
                  <Link href="/recipes/new">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une recette
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MenuUploadDialog 
                open={showMenuUpload}
                onOpenChange={setShowMenuUpload}
                onSuccess={fetchRecipes}
              />
              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher une recette..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Liste des recettes */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des recettes...</p>
                </div>
              ) : recipes.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    {search ? 'Aucune recette trouvée' : 'Aucune recette'}
                  </p>
                  <p className="text-gray-400 mb-4">
                    {search
                      ? 'Essayez une autre recherche'
                      : 'Commencez par créer votre première recette'}
                  </p>
                  {!search && (
                    <Link href="/recipes/new">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une recette
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipes.map((recipe) => (
                    <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        {recipe.description && (
                          <CardDescription className="line-clamp-2">
                            {recipe.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{recipe.ingredient_count} ingrédient(s)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="text-green-600 font-medium">Calibré pour 1 personne</span>
                          </div>
                          {(recipe.prep_time || recipe.cook_time) && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {recipe.prep_time && `Prép: ${formatTime(recipe.prep_time)}`}
                                {recipe.prep_time && recipe.cook_time && ' • '}
                                {recipe.cook_time && `Cuisson: ${formatTime(recipe.cook_time)}`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/recipes/${recipe.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(recipe.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Statistiques */}
              {recipes.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total de recettes</p>
                    <p className="text-2xl font-bold text-green-700">{recipes.length}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Ingrédients totaux</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {recipes.reduce((sum, r) => sum + r.ingredient_count, 0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
