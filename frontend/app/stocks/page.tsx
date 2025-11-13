'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Ingredient } from '@/types/ingredient'
import Header from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { IngredientDialog } from '@/components/IngredientDialog'

export default function StocksPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchIngredients()
    }
  }, [user, search])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/ingredients', window.location.origin)
      if (search) {
        url.searchParams.append('search', search)
      }
      url.searchParams.append('sortBy', 'updated_at')
      url.searchParams.append('sortOrder', 'desc')

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      } else {
        console.error('Erreur lors de la récupération des ingrédients')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      return
    }

    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIngredients(ingredients.filter((ing) => ing.id !== id))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingIngredient(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (success?: boolean) => {
    setIsDialogOpen(false)
    setEditingIngredient(null)
    if (success) {
      fetchIngredients()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                  <Package className="h-8 w-8" />
                  Mes Stocks
                </CardTitle>
                <CardDescription className="mt-2">
                  Gérez vos ingrédients et suivez vos quantités en temps réel
                </CardDescription>
              </div>
              <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un ingrédient
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher un ingrédient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tableau des ingrédients */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des ingrédients...</p>
              </div>
            ) : ingredients.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {search ? 'Aucun ingrédient trouvé' : 'Aucun ingrédient'}
                </p>
                <p className="text-gray-400 mb-4">
                  {search
                    ? 'Essayez une autre recherche'
                    : 'Commencez par ajouter votre premier ingrédient'}
                </p>
                {!search && (
                  <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un ingrédient
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Dernière modification</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(ingredient.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(ingredient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(ingredient.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Statistiques rapides */}
            {ingredients.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Total d'ingrédients</p>
                  <p className="text-2xl font-bold text-green-700">{ingredients.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Unités différentes</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Set(ingredients.map((i) => i.unit)).size}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Dernière mise à jour</p>
                  <p className="text-lg font-bold text-purple-700">
                    {ingredients[0] ? formatDate(ingredients[0].updated_at) : '-'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour ajouter/éditer */}
      <IngredientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        ingredient={editingIngredient}
        onClose={handleDialogClose}
      />
      </div>
    </>
  )
}
