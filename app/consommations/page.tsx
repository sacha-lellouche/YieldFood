'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { RecipeWithCount } from '@/types/recipe'
import type { ConsumptionType, ConsumptionWithDetails } from '@/types/consumption'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, TrendingDown, Search, ChefHat, Package, Users, Clock, CheckCircle2, AlertTriangle, Loader2, ShoppingCart, History, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ConsommationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [recipes, setRecipes] = useState<RecipeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Onglets
  const [activeTab, setActiveTab] = useState<'declare' | 'history'>('declare')
  
  // Consommations en cours de saisie
  const [consumptions, setConsumptions] = useState<Map<string, number>>(new Map())
  
  // Historique
  const [history, setHistory] = useState<ConsumptionWithDetails[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Édition de nom de consommation
  const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null)
  const [tempConsumptionName, setTempConsumptionName] = useState('')
  
  // Paramètres de validation
  const [consumptionType, setConsumptionType] = useState<ConsumptionType>('sale')
  const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().split('T')[0])
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationPreview, setValidationPreview] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchRecipes()
      if (activeTab === 'history') {
        fetchHistory()
      }
    }
  }, [user, search, activeTab])

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
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/consumptions')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const incrementConsumption = (recipeId: string) => {
    const newConsumptions = new Map(consumptions)
    const current = newConsumptions.get(recipeId) || 0
    newConsumptions.set(recipeId, current + 1)
    setConsumptions(newConsumptions)
  }

  const decrementConsumption = (recipeId: string) => {
    const newConsumptions = new Map(consumptions)
    const current = newConsumptions.get(recipeId) || 0
    if (current > 0) {
      if (current === 1) {
        newConsumptions.delete(recipeId)
      } else {
        newConsumptions.set(recipeId, current - 1)
      }
      setConsumptions(newConsumptions)
    }
  }

  const setConsumptionValue = (recipeId: string, value: string) => {
    const numValue = parseInt(value) || 0
    const newConsumptions = new Map(consumptions)
    if (numValue > 0) {
      newConsumptions.set(recipeId, numValue)
    } else {
      newConsumptions.delete(recipeId)
    }
    setConsumptions(newConsumptions)
  }

  const getTotalConsumptions = () => {
    return Array.from(consumptions.values()).reduce((sum, val) => sum + val, 0)
  }

  const handleValidate = async () => {
    if (consumptions.size === 0) {
      alert('Veuillez sélectionner au moins une recette')
      return
    }

    setValidating(true)
    const previews = []

    try {
      for (const [recipeId, portions] of consumptions.entries()) {
        const response = await fetch('/api/consumptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'preview',
            consumption: {
              recipe_id: recipeId,
              consumption_type: consumptionType,
              portions: portions,
              consumption_date: consumptionDate
            }
          })
        })

        if (response.ok) {
          const preview = await response.json()
          previews.push(preview)
        } else {
          throw new Error('Erreur lors du calcul de la prévisualisation')
        }
      }

      setValidationPreview(previews)
      setShowValidationDialog(true)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la préparation de la validation')
    } finally {
      setValidating(false)
    }
  }

  const handleConfirmValidation = async () => {
    setValidating(true)
    let successCount = 0
    let errorCount = 0

    // Generate a batch_id for this validation group
    const batchId = crypto.randomUUID()

    try {
      for (const preview of validationPreview) {
        const response = await fetch('/api/consumptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm',
            consumption: {
              recipe_id: preview.recipe_id,
              consumption_type: preview.consumption_type,
              portions: preview.portions,
              consumption_date: preview.consumption_date,
              batch_id: batchId
            }
          })
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
      }

      setShowValidationDialog(false)
      
      if (errorCount === 0) {
        alert(`✅ ${successCount} consommation(s) enregistrée(s) avec succès !`)
        setConsumptions(new Map())
        setConsumptionDate(new Date().toISOString().split('T')[0])
        fetchHistory()
      } else {
        alert(`⚠️ ${successCount} réussie(s), ${errorCount} échouée(s)`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la validation')
    } finally {
      setValidating(false)
    }
  }

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEditConsumptionName = (consumption: ConsumptionWithDetails) => {
    setEditingConsumptionId(consumption.id)
    setTempConsumptionName(consumption.name || `Consommation du ${formatDateTime(consumption.created_at)}`)
  }

  const handleSaveConsumptionName = async (consumptionId: string) => {
    try {
      const response = await fetch(`/api/consumptions?id=${consumptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempConsumptionName })
      })

      if (response.ok) {
        setHistory(history.map(c => 
          c.id === consumptionId ? { ...c, name: tempConsumptionName } : c
        ))
        setEditingConsumptionId(null)
        setTempConsumptionName('')
      } else {
        alert('Erreur lors de la mise à jour du nom')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du nom')
    }
  }

  const handleCancelEditName = () => {
    setEditingConsumptionId(null)
    setTempConsumptionName('')
  }

  const getConsumptionsByDate = () => {
    const grouped = new Map<string, ConsumptionWithDetails[]>()
    
    history.forEach(consumption => {
      const date = consumption.consumption_date
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(consumption)
    })
    
    return Array.from(grouped.entries())
      .map(([date, consumptions]) => ({ date, consumptions }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Calculate history summary before any early returns
  const historyByDate = getConsumptionsByDate()

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-orange-600 flex items-center gap-2">
                  <TrendingDown className="h-8 w-8" />
                  Mes Consommations
                </CardTitle>
                <CardDescription className="mt-2">
                  Déclarez vos ventes et pertes en un clic
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push('/integrations')}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Connexions API avec mon logiciel de caisse
                </Button>
                
                {activeTab === 'declare' && getTotalConsumptions() > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                      <p className="text-sm font-medium">Total portions</p>
                      <p className="text-2xl font-bold">{getTotalConsumptions()}</p>
                    </div>
                    <Button 
                      onClick={handleValidate}
                      disabled={validating}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Préparation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Valider ({consumptions.size})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mt-4 border-b border-gray-200 pb-2">
              <Button
                variant={activeTab === 'declare' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('declare')}
                className={activeTab === 'declare' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Plus className="mr-2 h-4 w-4" />
                Déclarer
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('history')}
                className={activeTab === 'history' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <History className="mr-2 h-4 w-4" />
                Historique
              </Button>
            </div>
          </CardHeader>

          {activeTab === 'declare' && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={consumptionType} onValueChange={(val: ConsumptionType) => setConsumptionType(val)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                          <span>Vente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="loss">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span>Perte</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={consumptionDate}
                    onChange={(e) => setConsumptionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Rechercher une recette..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Contenu selon l'onglet */}
        {activeTab === 'declare' ? (
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez vos recettes</CardTitle>
              <CardDescription>
                Utilisez les boutons +/- pour indiquer le nombre de portions consommées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des recettes...</p>
                </div>
              ) : recipes.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    {search ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
                  </p>
                  <p className="text-gray-400 mb-4">
                    {search ? 'Essayez une autre recherche' : 'Créez d\'abord des recettes'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipes.map((recipe) => {
                    const quantity = consumptions.get(recipe.id) || 0
                    const isSelected = quantity > 0

                    return (
                      <Card 
                        key={recipe.id} 
                        className={`transition-all ${
                          isSelected 
                            ? 'ring-2 ring-orange-500 shadow-lg bg-orange-50' 
                            : 'hover:shadow-lg'
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          {recipe.description && (
                            <CardDescription className="line-clamp-2">
                              {recipe.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>{recipe.ingredient_count} ingrédient(s)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-orange-600 font-medium">1 portion</span>
                              </div>
                              {(recipe.prep_time || recipe.cook_time) && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-xs">
                                    {recipe.prep_time && `${formatTime(recipe.prep_time)}`}
                                    {recipe.prep_time && recipe.cook_time && ' • '}
                                    {recipe.cook_time && `${formatTime(recipe.cook_time)}`}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-center gap-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => decrementConsumption(recipe.id)}
                                disabled={quantity === 0}
                                className="h-10 w-10 rounded-full"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <Input
                                type="text"
                                value={quantity}
                                onChange={(e) => setConsumptionValue(recipe.id, e.target.value)}
                                className="w-20 text-center text-xl font-bold border-0 focus:ring-2 focus:ring-orange-500"
                                placeholder="0"
                              />
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => incrementConsumption(recipe.id)}
                                className="h-10 w-10 rounded-full bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {isSelected && (
                              <div className="text-center text-sm text-orange-600 font-medium">
                                ✓ {quantity} portion{quantity > 1 ? 's' : ''} sélectionnée{quantity > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {recipes.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">Recettes disponibles</p>
                    <p className="text-2xl font-bold text-orange-700">{recipes.length}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Recettes sélectionnées</p>
                    <p className="text-2xl font-bold text-blue-700">{consumptions.size}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total portions</p>
                    <p className="text-2xl font-bold text-green-700">{getTotalConsumptions()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Historique des consommations</CardTitle>
              <CardDescription>
                Détail de toutes vos validations de consommations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement de l'historique...</p>
                </div>
              ) : historyByDate.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Aucun historique</p>
                  <p className="text-gray-400">Commencez par déclarer vos consommations</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {historyByDate.map(({ date, consumptions }) => (
                    <div key={date} className="space-y-3">
                      {/* En-tête de date */}
                      <div className="flex items-center gap-3 pb-2 border-b-2 border-orange-200">
                        <h3 className="text-lg font-bold text-gray-800">
                          {formatDate(date)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({consumptions.length} validation{consumptions.length > 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Table des consommations pour cette date */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom de la validation</TableHead>
                            <TableHead>Recette</TableHead>
                            <TableHead className="text-center">Type</TableHead>
                            <TableHead className="text-center">Portions</TableHead>
                            <TableHead className="text-center">Heure</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consumptions.map((consumption) => (
                            <TableRow key={consumption.id}>
                              <TableCell className="font-medium max-w-xs">
                                {editingConsumptionId === consumption.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={tempConsumptionName}
                                      onChange={(e) => setTempConsumptionName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveConsumptionName(consumption.id)
                                        } else if (e.key === 'Escape') {
                                          handleCancelEditName()
                                        }
                                      }}
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveConsumptionName(consumption.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEditName}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditConsumptionName(consumption)}
                                    className="text-left hover:text-orange-600 transition-colors cursor-pointer"
                                    title="Cliquer pour modifier le nom"
                                  >
                                    {consumption.name || `Consommation du ${formatDateTime(consumption.created_at)}`}
                                  </button>
                                )}
                              </TableCell>
                              <TableCell>{consumption.recipe.name}</TableCell>
                              <TableCell className="text-center">
                                {consumption.consumption_type === 'sale' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Vente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Perte
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {consumption.portions}
                              </TableCell>
                              <TableCell className="text-center text-sm text-gray-600">
                                {new Date(consumption.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}

                  {/* Stats globales */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Statistiques globales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Total ventes</p>
                        <p className="text-2xl font-bold text-green-700">
                          {history.filter(c => c.consumption_type === 'sale').reduce((sum, c) => sum + c.portions, 0)} portions
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 font-medium">Total pertes</p>
                        <p className="text-2xl font-bold text-red-700">
                          {history.filter(c => c.consumption_type === 'loss').reduce((sum, c) => sum + c.portions, 0)} portions
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-600 font-medium">Total portions</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {history.reduce((sum, c) => sum + c.portions, 0)} portions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de validation */}
        <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                Confirmer les consommations
              </DialogTitle>
              <DialogDescription>
                Vérifiez les impacts sur vos stocks avant de valider
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {validationPreview.map((preview, index) => (
                <Card key={index} className={preview.has_insufficient_stock ? 'border-orange-300' : ''}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{preview.recipe_name}</span>
                      <span className="text-sm font-normal">
                        {preview.portions} portion{preview.portions > 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                    {preview.has_insufficient_stock && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Attention : Stock insuffisant pour certains ingrédients</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {preview.calculated_impacts.map((impact: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-2 rounded ${
                            !impact.is_sufficient ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{impact.ingredient_name}</span>
                            {!impact.is_sufficient && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-mono">
                              {impact.current_stock} {impact.unit}
                            </span>
                            <span className="mx-2">→</span>
                            <span className={`font-mono font-bold ${
                              !impact.is_sufficient ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {impact.stock_after} {impact.unit}
                            </span>
                            <span className="ml-2 text-gray-500">
                              (-{impact.quantity_needed} {impact.unit})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowValidationDialog(false)}
                disabled={validating}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmValidation}
                disabled={validating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
