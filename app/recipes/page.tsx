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
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

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

  // Fonction pour déterminer la catégorie d'une recette basée sur son nom
  const getCategoryFromName = (name: string): string => {
    const nameLower = name.toLowerCase()
    
    // Entrées
    if (nameLower.includes('salade') || 
        nameLower.includes('soupe') || 
        nameLower.includes('velouté') ||
        nameLower.includes('entrée') ||
        nameLower.includes('tartare') ||
        nameLower.includes('carpaccio') ||
        nameLower.includes('terrine') ||
        nameLower.includes('bruschetta')) {
      return 'entrée'
    }
    
    // Desserts
    if (nameLower.includes('dessert') || 
        nameLower.includes('gâteau') || 
        nameLower.includes('tarte') ||
        nameLower.includes('mousse') ||
        nameLower.includes('crème') ||
        nameLower.includes('tiramisu') ||
        nameLower.includes('fondant') ||
        nameLower.includes('brownie') ||
        nameLower.includes('cookie') ||
        nameLower.includes('macaron') ||
        nameLower.includes('éclair') ||
        nameLower.includes('profiterole') ||
        nameLower.includes('millefeuille') ||
        nameLower.includes('cheese') && nameLower.includes('cake') ||
        nameLower.includes('panna cotta') ||
        nameLower.includes('île flottante')) {
      return 'dessert'
    }
    
    // Par défaut: plat
    return 'plat'
  }

  // Filtrer et grouper les recettes
  const getFilteredRecipes = () => {
    let filtered = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(search.toLowerCase())
    )

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recipe => getCategoryFromName(recipe.name) === categoryFilter)
    }

    // Grouper par catégorie
    const grouped = {
      entrée: filtered.filter(r => getCategoryFromName(r.name) === 'entrée'),
      plat: filtered.filter(r => getCategoryFromName(r.name) === 'plat'),
      dessert: filtered.filter(r => getCategoryFromName(r.name) === 'dessert')
    }

    return grouped
  }

  const groupedRecipes = getFilteredRecipes()

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
              {/* Barre de recherche et filtres */}
              <div className="mb-6 space-y-4">
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
                
                {/* Filtres par catégorie */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('all')}
                    className={categoryFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Toutes ({recipes.length})
                  </Button>
                  <Button
                    variant={categoryFilter === 'entrée' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('entrée')}
                    className={categoryFilter === 'entrée' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    🥗 Entrées ({groupedRecipes.entrée.length})
                  </Button>
                  <Button
                    variant={categoryFilter === 'plat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('plat')}
                    className={categoryFilter === 'plat' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    🍽️ Plats ({groupedRecipes.plat.length})
                  </Button>
                  <Button
                    variant={categoryFilter === 'dessert' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('dessert')}
                    className={categoryFilter === 'dessert' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    🍰 Desserts ({groupedRecipes.dessert.length})
                  </Button>
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
                <div className="space-y-8">
                  {/* Entrées */}
                  {groupedRecipes.entrée.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        🥗 Entrées <span className="text-sm font-normal text-gray-500">({groupedRecipes.entrée.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedRecipes.entrée.map((recipe) => (
                          <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} formatTime={formatTime} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plats */}
                  {groupedRecipes.plat.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        🍽️ Plats <span className="text-sm font-normal text-gray-500">({groupedRecipes.plat.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedRecipes.plat.map((recipe) => (
                          <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} formatTime={formatTime} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desserts */}
                  {groupedRecipes.dessert.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        🍰 Desserts <span className="text-sm font-normal text-gray-500">({groupedRecipes.dessert.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedRecipes.dessert.map((recipe) => (
                          <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} formatTime={formatTime} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

// Composant pour une carte de recette
function RecipeCard({ recipe, onDelete, formatTime }: { recipe: RecipeWithCount, onDelete: (id: string) => void, formatTime: (minutes: number | null) => string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            onClick={() => onDelete(recipe.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
