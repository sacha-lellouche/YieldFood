'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { 
  ConsumptionWithDetails, 
  ConsumptionInput, 
  ConsumptionPreview,
  ConsumptionType 
} from '@/types/consumption'
import type { RecipeWithCount } from '@/types/recipe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, TrendingDown, AlertTriangle, CheckCircle2, Search, Calendar, Trash2, Package2, Minus } from 'lucide-react'

export default function ConsommationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // État pour les données
  const [recipes, setRecipes] = useState<RecipeWithCount[]>([])
  const [consumptions, setConsumptions] = useState<ConsumptionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  
  // État pour le formulaire
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [portions, setPortions] = useState('1')
  const [consumptionType, setConsumptionType] = useState<ConsumptionType>('sale')
  const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  
  // État pour la prévisualisation
  const [preview, setPreview] = useState<ConsumptionPreview | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // État pour les consommations en attente de validation
  const [pendingConsumptions, setPendingConsumptions] = useState<ConsumptionPreview[]>([])
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [validationResult, setValidationResult] = useState({ success: 0, total: 0 })

  // Filtres pour la liste
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchRecipes()
      fetchConsumptions()
    }
  }, [user])

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error)
    }
  }

  const fetchConsumptions = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/consumptions', window.location.origin)
      
      if (filterStartDate) url.searchParams.append('start_date', filterStartDate)
      if (filterEndDate) url.searchParams.append('end_date', filterEndDate)
      if (filterType !== 'all') url.searchParams.append('type', filterType)

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setConsumptions(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des consommations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async () => {
    if (!selectedRecipeId || !portions || parseFloat(portions) <= 0) {
      alert('Veuillez sélectionner une recette et indiquer le nombre de portions')
      return
    }

    try {
      setSubmitting(true)
      
      const consumptionInput: ConsumptionInput = {
        recipe_id: selectedRecipeId,
        consumption_type: consumptionType,
        portions: parseFloat(portions),
        consumption_date: consumptionDate,
        notes: notes || undefined
      }

      const response = await fetch('/api/consumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          consumption: consumptionInput
        })
      })

      if (response.ok) {
        const previewData = await response.json()
        
        // Ajouter directement aux consommations en attente
        setPendingConsumptions([...pendingConsumptions, previewData])
        
        // Réinitialiser le formulaire pour la prochaine saisie
        setSelectedRecipeId('')
        setPortions('1')
        setNotes('')
        
      } else {
        const errorText = await response.text()
        let errorMessage = 'Erreur lors du calcul'
        
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        if (response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.'
          // Rediriger vers la page de connexion
          setTimeout(() => router.push('/login'), 2000)
        }
        
        console.error('Erreur API:', errorMessage, 'Status:', response.status)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erreur complète:', error)
      alert(`Erreur lors de l'ajout à la liste: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const incrementPortions = () => {
    const current = parseFloat(portions) || 0
    setPortions((current + 1).toString())
  }

  const decrementPortions = () => {
    const current = parseFloat(portions) || 0
    if (current > 1) {
      setPortions((current - 1).toString())
    }
  }

  const handleConfirm = async () => {
    if (!preview) return

    try {
      setSubmitting(true)
      
      const consumptionInput: ConsumptionInput = {
        recipe_id: preview.recipe_id,
        consumption_type: preview.consumption_type,
        portions: preview.portions,
        consumption_date: preview.consumption_date,
        notes: notes || undefined
      }

      const response = await fetch('/api/consumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          consumption: consumptionInput
        })
      })

      if (response.ok) {
        // Réinitialiser le formulaire
        setSelectedRecipeId('')
        setPortions('1')
        setNotes('')
        setConsumptionDate(new Date().toISOString().split('T')[0])
        setPreview(null)
        setShowPreviewDialog(false)
        
        // Recharger les consommations
        fetchConsumptions()
        
        alert('Consommation enregistrée avec succès !')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmBatch = async () => {
    if (pendingConsumptions.length === 0) return

    try {
      setSubmitting(true)
      let successCount = 0
      let errorCount = 0

      // Confirmer chaque consommation en attente
      for (const pending of pendingConsumptions) {
        const consumptionInput: ConsumptionInput = {
          recipe_id: pending.recipe_id,
          consumption_type: pending.consumption_type,
          portions: pending.portions,
          consumption_date: pending.consumption_date,
          notes: undefined
        }

        const response = await fetch('/api/consumptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm',
            consumption: consumptionInput
          })
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
      }

      // Réinitialiser
      setPendingConsumptions([])
      setShowBatchConfirmDialog(false)
      
      // Recharger les consommations
      fetchConsumptions()
      
      // Afficher le dialog de succès
      setValidationResult({ success: successCount, total: successCount + errorCount })
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la validation du lot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemovePending = (index: number) => {
    setPendingConsumptions(pendingConsumptions.filter((_, i) => i !== index))
  }

  const filteredConsumptions = consumptions.filter(c => {
    if (searchTerm && !c.recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Titre de la page */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-700 flex items-center gap-2">
              <TrendingDown className="w-8 h-8" />
              Mes Consommations
            </CardTitle>
            <CardDescription>
              Enregistrez vos ventes et pertes de recettes, le stock d&apos;ingrédients sera automatiquement mis à jour
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Formulaire de création */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouvelle Consommation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection de la recette */}
              <div className="space-y-2">
                <Label htmlFor="recipe">Recette *</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger id="recipe">
                    <SelectValue placeholder="Sélectionner une recette" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre de portions */}
              <div className="space-y-2">
                <Label htmlFor="portions">Nombre de portions *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementPortions}
                    disabled={parseFloat(portions) <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="portions"
                    type="number"
                    step="1"
                    min="1"
                    value={portions}
                    onChange={(e) => setPortions(e.target.value)}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={incrementPortions}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Type de consommation */}
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={consumptionType} onValueChange={(v) => setConsumptionType(v as ConsumptionType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Vente</SelectItem>
                    <SelectItem value="loss">Perte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={consumptionDate}
                  onChange={(e) => setConsumptionDate(e.target.value)}
                />
              </div>

              {/* Notes (optionnel) */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des commentaires..."
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button 
                onClick={handleAddToList} 
                disabled={submitting || !selectedRecipeId || !portions}
                className="w-full md:w-auto"
              >
                {submitting ? 'Ajout en cours...' : 'Ajouter à la liste'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des consommations en attente */}
        {pendingConsumptions.length > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="w-5 h-5 text-blue-600" />
                  Consommations en attente ({pendingConsumptions.length})
                </CardTitle>
                <Button 
                  onClick={() => setShowBatchConfirmDialog(true)}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Valider toutes les consommations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recette</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Portions</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Ingrédients</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingConsumptions.map((pending, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {pending.recipe_name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pending.consumption_type === 'sale' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pending.consumption_type === 'sale' ? 'Vente' : 'Perte'}
                        </span>
                      </TableCell>
                      <TableCell>{pending.portions}</TableCell>
                      <TableCell>
                        {new Date(pending.consumption_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {pending.calculated_impacts.map((impact, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{impact.ingredient_name}:</span>
                              <span className="text-gray-600">-{impact.quantity_needed} {impact.unit}</span>
                              {!impact.is_sufficient && (
                                <AlertTriangle className="w-3 h-3 text-orange-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePending(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Liste des consommations */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Consommations</CardTitle>
            
            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom de recette..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterType">Type</Label>
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); fetchConsumptions(); }}>
                  <SelectTrigger id="filterType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="sale">Ventes</SelectItem>
                    <SelectItem value="loss">Pertes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Date début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => { setFilterStartDate(e.target.value); }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => { setFilterEndDate(e.target.value); }}
                />
              </div>
            </div>

            <Button onClick={fetchConsumptions} variant="outline" className="mt-2">
              Appliquer les filtres
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredConsumptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune consommation enregistrée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Recette</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Portions</TableHead>
                      <TableHead>Ingrédients impactés</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsumptions.map((consumption) => (
                      <TableRow key={consumption.id}>
                        <TableCell>
                          {new Date(consumption.consumption_date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {consumption.recipe.name}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            consumption.consumption_type === 'sale' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {consumption.consumption_type === 'sale' ? 'Vente' : 'Perte'}
                          </span>
                        </TableCell>
                        <TableCell>{consumption.portions}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {consumption.impacts.length} ingrédient(s)
                          </div>
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {consumption.impacts.slice(0, 2).map((impact) => (
                              <div key={impact.id}>
                                {impact.ingredient_name}: -{impact.quantity_consumed} {impact.unit}
                              </div>
                            ))}
                            {consumption.impacts.length > 2 && (
                              <div className="text-gray-400">
                                +{consumption.impacts.length - 2} autre(s)...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {consumption.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de prévisualisation */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {preview?.has_insufficient_stock ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Attention : Stock insuffisant</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Prévisualisation des impacts</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Vérifiez les quantités qui seront déduites du stock avant de confirmer
              </DialogDescription>
            </DialogHeader>

            {preview && (
              <div className="space-y-4">
                {/* Résumé */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Résumé</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Recette:</span>
                      <p className="font-medium">{preview.recipe_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Portions:</span>
                      <p className="font-medium">{preview.portions}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium">
                        {preview.consumption_type === 'sale' ? 'Vente' : 'Perte'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">
                        {new Date(preview.consumption_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tableau des impacts */}
                <div>
                  <h3 className="font-semibold mb-2">Impact sur les ingrédients</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrédient</TableHead>
                        <TableHead className="text-right">Quantité nécessaire</TableHead>
                        <TableHead className="text-right">Stock actuel</TableHead>
                        <TableHead className="text-right">Stock après</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.calculated_impacts.map((impact, idx) => (
                        <TableRow 
                          key={idx}
                          className={!impact.is_sufficient ? 'bg-red-50' : ''}
                        >
                          <TableCell className="font-medium">
                            {impact.ingredient_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {impact.quantity_needed} {impact.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {impact.current_stock} {impact.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {impact.stock_after} {impact.unit}
                          </TableCell>
                          <TableCell className="text-center">
                            {impact.is_sufficient ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Avertissement stock insuffisant */}
                {preview.has_insufficient_stock && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-800">Stock insuffisant</p>
                        <p className="text-sm text-orange-700 mt-1">
                          Certains ingrédients ont un stock insuffisant. La consommation sera quand même 
                          enregistrée mais le stock de ces ingrédients deviendra négatif.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPreviewDialog(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? 'Enregistrement...' : 'Valider la consommation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation du lot */}
        <Dialog open={showBatchConfirmDialog} onOpenChange={setShowBatchConfirmDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Confirmer la validation du lot
              </DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de valider {pendingConsumptions.length} consommation(s). 
                Le stock des ingrédients sera mis à jour automatiquement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Résumé des consommations */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Résumé des consommations</h3>
                <div className="space-y-2">
                  {pendingConsumptions.map((pending, index) => (
                    <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
                      <div>
                        <span className="font-medium">{pending.recipe_name}</span>
                        <span className="text-gray-500 ml-2">
                          ({pending.portions} portions - {pending.consumption_type === 'sale' ? 'Vente' : 'Perte'})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {pending.calculated_impacts.length} ingrédient(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avertissement stock insuffisant */}
              {pendingConsumptions.some(p => p.has_insufficient_stock) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800">Stock insuffisant détecté</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Certaines consommations ont des ingrédients avec un stock insuffisant. 
                        Les stocks deviendront négatifs après validation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowBatchConfirmDialog(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmBatch}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? 'Validation en cours...' : `Valider les ${pendingConsumptions.length} consommations`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de succès */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                Consommations validées avec succès !
              </DialogTitle>
            </DialogHeader>

            <div className="py-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {validationResult.success} consommation(s) enregistrée(s)
                </p>
                <p className="text-sm text-gray-600">
                  Les stocks d&apos;ingrédients ont été automatiquement mis à jour
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Parfait !
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
