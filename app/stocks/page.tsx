'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { StockWithProduct } from '@/types/stock'
import { Supplier } from '@/types/supplier'
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
import { Plus, Pencil, Trash2, Search, Package, Minus, Filter, ArrowUpDown, ShoppingCart, ChevronDown, ChevronRight, TrendingDown, X } from 'lucide-react'
import { StockDialog } from '@/components/StockDialog'
import SupplierSelect from '@/components/SupplierSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function StocksPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stocks, setStocks] = useState<StockWithProduct[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'category'>('category')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<StockWithProduct | null>(null)
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null)
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [tempQuantity, setTempQuantity] = useState<string>('')
  const [generatingOrders, setGeneratingOrders] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [tempCategory, setTempCategory] = useState<string>('')
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [tempUnit, setTempUnit] = useState<string>('')
  const [showConsumptionSummary, setShowConsumptionSummary] = useState(false)

  // Catégories suggérées (ordonnées par pertinence)
  const SUGGESTED_CATEGORIES = [
    'Fruits & Légumes',
    'Viandes & Volailles',
    'Poissons & Fruits de mer',
    'Produits laitiers',
    'Épicerie salée / sucrée',
    'Féculents & Pâtes',
    'Boulangerie & Viennoiserie',
    'Condiments & Sauces',
    'Huiles & Vinaigres',
    'Épices & Herbes',
    'Boissons',
    'Surgelés',
    'Conserves',
    'Autre'
  ]

  // Unités suggérées
  const SUGGESTED_UNITS = [
    'kg',
    'g',
    'L',
    'mL',
    'unité',
    'pièce',
    'botte',
    'sachet',
    'boîte',
    'pot',
    'bouteille',
    'tranche',
    'portion'
  ]

  const [consumptionSummary, setConsumptionSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchStocks()
      fetchSuppliers()
      fetchConsumptionSummary()
    }
  }, [user])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error)
    }
  }

  const fetchConsumptionSummary = async () => {
    try {
      setLoadingSummary(true)
      const response = await fetch('/api/consumptions/summary')
      if (response.ok) {
        const data = await response.json()
        setConsumptionSummary(data)
        // Afficher automatiquement le dialogue uniquement si on vient de déclarer des consommations
        // (vérifié via un paramètre URL ou sessionStorage)
        const urlParams = new URLSearchParams(window.location.search)
        const fromConsumptions = urlParams.get('from') === 'consumptions' || sessionStorage.getItem('showConsumptionSummary') === 'true'
        
        if (data.totalDishes > 0 && fromConsumptions) {
          setShowConsumptionSummary(true)
          // Nettoyer après affichage
          sessionStorage.removeItem('showConsumptionSummary')
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du récapitulatif:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const fetchStocks = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/stock', window.location.origin)
      if (search) {
        url.searchParams.append('search', search)
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setStocks(data)
      } else {
        console.error('Erreur lors de la récupération des stocks')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) {
      return
    }

    try {
      const response = await fetch(`/api/stock?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStocks(stocks.filter((stock) => stock.id !== id))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEdit = (stock: StockWithProduct) => {
    setEditingStock(stock)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingStock(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (success?: boolean) => {
    setIsDialogOpen(false)
    setEditingStock(null)
    if (success) {
      fetchStocks()
    }
  }

  const handleSearch = () => {
    fetchStocks()
  }

  const adjustQuantity = async (stock: StockWithProduct, delta: number) => {
    setUpdatingQuantity(stock.id)
    try {
      const response = await fetch(`/api/stock/${stock.product_id}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: delta }),
      })

      if (response.ok) {
        const data = await response.json()
        setStocks(stocks.map((s) =>
          s.id === stock.id ? { ...s, quantity: data.stock.quantity } : s
        ))
      } else {
        alert('Erreur lors de l\'ajustement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'ajustement')
    } finally {
      setUpdatingQuantity(null)
    }
  }

  const handleQuantityEdit = (stock: StockWithProduct) => {
    setEditingQuantityId(stock.id)
    setTempQuantity(stock.quantity.toString())
  }

  const handleQuantityChange = (value: string) => {
    // Permettre les nombres décimaux
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTempQuantity(value)
    }
  }

  const handleQuantitySave = async (stock: StockWithProduct) => {
    const newQuantity = parseFloat(tempQuantity)
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Quantité invalide')
      setEditingQuantityId(null)
      return
    }

    setUpdatingQuantity(stock.id)
    try {
      const response = await fetch(`/api/stock?id=${stock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id: stock.product_id,
          quantity: newQuantity 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStocks(stocks.map((s) =>
          s.id === stock.id ? { ...s, quantity: newQuantity } : s
        ))
        setEditingQuantityId(null)
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setUpdatingQuantity(null)
    }
  }

  const handleQuantityCancel = () => {
    setEditingQuantityId(null)
    setTempQuantity('')
  }

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  const handleCategoryEdit = (stock: StockWithProduct) => {
    setEditingCategoryId(stock.id)
    // Utiliser category_override si défini, sinon product.category
    setTempCategory(stock.category_override || stock.product.category || '')
  }

  const handleCategoryChange = (value: string) => {
    setTempCategory(value)
  }

  const handleCategorySave = async (stock: StockWithProduct) => {
    try {
      console.log('Saving category override for stock:', stock.id, 'Category:', tempCategory)
      const response = await fetch(`/api/stock?id=${stock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id: stock.product_id,
          quantity: stock.quantity,
          category_override: tempCategory || null
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setStocks(stocks.map((s) =>
          s.id === stock.id ? { ...s, category_override: tempCategory || null } : s
        ))
        setEditingCategoryId(null)
        setTempCategory('')
      } else {
        console.error('Error response:', data)
        alert(`Erreur lors de la mise à jour de la catégorie: ${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour de la catégorie')
    }
  }

  const handleCategoryCancel = () => {
    setEditingCategoryId(null)
    setTempCategory('')
  }

  const handleUnitEdit = (stock: StockWithProduct) => {
    setEditingUnitId(stock.id)
    setTempUnit(stock.product.unit)
  }

  const handleUnitChange = (value: string) => {
    setTempUnit(value)
  }

  const handleUnitSave = async (stock: StockWithProduct) => {
    if (!tempUnit.trim()) {
      alert('L\'unité ne peut pas être vide')
      return
    }

    try {
      // Mise à jour du produit (pas du stock)
      const response = await fetch(`/api/products/${stock.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          unit: tempUnit.trim()
        }),
      })

      if (response.ok) {
        // Mettre à jour localement
        setStocks(stocks.map((s) =>
          s.product_id === stock.product_id 
            ? { ...s, product: { ...s.product, unit: tempUnit.trim() } } 
            : s
        ))
        setEditingUnitId(null)
        setTempUnit('')
      } else {
        const data = await response.json()
        alert(`Erreur lors de la mise à jour de l'unité: ${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour de l\'unité')
    }
  }

  const handleUnitCancel = () => {
    setEditingUnitId(null)
    setTempUnit('')
  }

  const capitalizeCategory = (category: string | null) => {
    if (!category) return 'Non catégorisé'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getEffectiveCategory = (stock: StockWithProduct) => {
    return stock.category_override || stock.product.category
  }

  const handleSupplierChange = async (stockId: string, productId: string, supplierId: string | null) => {
    try {
      const stock = stocks.find(s => s.id === stockId)
      if (!stock) return

      const response = await fetch(`/api/stock?id=${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id: productId,
          quantity: stock.quantity,
          supplier_id: supplierId 
        }),
      })

      if (response.ok) {
        setStocks(stocks.map((s) =>
          s.id === stockId ? { ...s, supplier_id: supplierId } : s
        ))
      } else {
        alert('Erreur lors de la mise à jour du fournisseur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du fournisseur')
    }
  }

  const handleGenerateOrders = async () => {
    setGeneratingOrders(true)
    try {
      const response = await fetch('/api/orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des commandes')
      }

      const data = await response.json()
      
      if (data.ordersCreated === 0) {
        alert('Aucune commande nécessaire. Tous vos produits ont un stock suffisant ou n\'ont pas de fournisseur associé.')
      } else {
        alert(`✅ ${data.ordersCreated} commande(s) créée(s) avec succès !\n\nVos commandes ont été générées pour les produits en rupture de stock.`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création des commandes')
    } finally {
      setGeneratingOrders(false)
    }
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { color: 'text-red-600', label: 'Rupture' }
    if (quantity < threshold) return { color: 'text-orange-600', label: 'Bas' }
    return { color: 'text-green-600', label: 'OK' }
  }

  // Obtenir les catégories uniques (en utilisant category_override ou product.category)
  const categories = Array.from(new Set(stocks.map(s => getEffectiveCategory(s)).filter(Boolean)))
    .sort((a, b) => {
      // Trier selon l'ordre des catégories suggérées
      const indexA = SUGGESTED_CATEGORIES.indexOf(a)
      const indexB = SUGGESTED_CATEGORIES.indexOf(b)
      
      // Si les deux sont dans les suggestions, utiliser cet ordre
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      // Si seulement A est dans les suggestions, A vient en premier
      if (indexA !== -1) return -1
      // Si seulement B est dans les suggestions, B vient en premier
      if (indexB !== -1) return 1
      // Sinon, ordre alphabétique
      return a.localeCompare(b)
    })

  // Filtrer et trier les stocks
  const filteredAndSortedStocks = stocks
    .filter(stock => {
      // Filtre par recherche
      if (search && !stock.product.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Filtre par catégorie
      if (categoryFilter !== 'all' && getEffectiveCategory(stock) !== categoryFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.product.name.localeCompare(b.product.name)
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'category':
          const catA = getEffectiveCategory(a) || 'Non catégorisé'
          const catB = getEffectiveCategory(b) || 'Non catégorisé'
          // Trier par catégorie, puis par nom dans chaque catégorie
          comparison = catA.localeCompare(catB)
          if (comparison === 0) {
            comparison = a.product.name.localeCompare(b.product.name)
          }
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📦 Gestion des Stocks</h1>
            <p className="text-gray-600 mt-1">
              Gérez votre inventaire de produits
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {consumptionSummary && consumptionSummary.totalDishes > 0 && (
              <Button
                onClick={() => setShowConsumptionSummary(true)}
                variant="outline"
                size="lg"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <TrendingDown className="mr-2 h-5 w-5" />
                Voir les consommations ({consumptionSummary.totalDishes} plat{consumptionSummary.totalDishes > 1 ? 's' : ''})
              </Button>
            )}
            <Button
              onClick={handleGenerateOrders}
              disabled={generatingOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {generatingOrders ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Génération...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Commander produits en rupture
                </>
              )}
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un produit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Produits
              </CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stocks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-orange-600">
                Stock Bas
              </CardTitle>
              <Minus className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stocks.filter((s) => {
                  const threshold = s.product.low_stock_threshold || 5
                  return s.quantity > 0 && s.quantity < threshold
                }).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-red-600">
                En Rupture
              </CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stocks.filter((s) => s.quantity === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher et Filtrer</CardTitle>
            <CardDescription>Filtrer par nom, catégorie et trier les résultats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {search && (
                <Button
                  onClick={() => setSearch('')}
                  variant="ghost"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Filters and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Catégorie
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat!}>
                        {capitalizeCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Trier par
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="quantity">Quantité</SelectItem>
                    <SelectItem value="category">Catégorie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordre</label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Croissant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Croissant ↑</SelectItem>
                    <SelectItem value="desc">Décroissant ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(search || categoryFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Filtres actifs:</span>
                {search && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Recherche: {search}
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    Catégorie: {capitalizeCategory(categoryFilter)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                  }}
                  className="ml-auto"
                >
                  Tout réinitialiser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Stocks</CardTitle>
            <CardDescription>
              {filteredAndSortedStocks.length} produit{filteredAndSortedStocks.length !== 1 ? 's' : ''} 
              {(search || categoryFilter !== 'all') && ` (${stocks.length} au total)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : filteredAndSortedStocks.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {stocks.length === 0 ? 'Aucun stock' : 'Aucun résultat'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {stocks.length === 0 
                    ? 'Commencez par ajouter des produits à votre inventaire'
                    : 'Aucun produit ne correspond à vos critères de recherche'}
                </p>
                {stocks.length === 0 ? (
                  <Button
                    onClick={handleAdd}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un produit
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSearch('')
                      setCategoryFilter('all')
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedStocks.map((stock, index) => {
                      const threshold = stock.product.low_stock_threshold || 5
                      const status = getStockStatus(stock.quantity, threshold)
                      const currentCategory = getEffectiveCategory(stock) || 'Non catégorisé'
                      const prevCategory = index > 0 ? (getEffectiveCategory(filteredAndSortedStocks[index - 1]) || 'Non catégorisé') : null
                      const isNewCategory = sortBy === 'category' && currentCategory !== prevCategory
                      const isCategoryCollapsed = collapsedCategories.has(currentCategory)
                      
                      return (
                        <>
                          {isNewCategory && (
                            <TableRow 
                              key={`category-${currentCategory}`} 
                              className="bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 cursor-pointer border-t-2 border-blue-300"
                              onClick={() => toggleCategory(currentCategory)}
                            >
                              <TableCell colSpan={7} className="font-bold text-gray-800 py-3">
                                <div className="flex items-center gap-2">
                                  {isCategoryCollapsed ? (
                                    <ChevronRight className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                  <span className="text-base">{capitalizeCategory(currentCategory)}</span>
                                  <span className="text-sm font-normal text-gray-600 ml-2">
                                    ({filteredAndSortedStocks.filter(s => (getEffectiveCategory(s) || 'Non catégorisé') === currentCategory).length} produit{filteredAndSortedStocks.filter(s => (getEffectiveCategory(s) || 'Non catégorisé') === currentCategory).length > 1 ? 's' : ''})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {!isCategoryCollapsed && (
                            <TableRow key={stock.id}>
                              <TableCell className="font-medium">
                                {stock.product.name}
                              </TableCell>
                              <TableCell>
                                <div className="min-w-[200px]">
                                  <SupplierSelect
                                    value={stock.supplier_id}
                                    onChange={(supplierId) => handleSupplierChange(stock.id, stock.product_id, supplierId)}
                                    suppliers={suppliers}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                {editingCategoryId === stock.id ? (
                                  <div className="flex items-center gap-2">
                                    <Select value={tempCategory} onValueChange={handleCategoryChange}>
                                      <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Choisir une catégorie" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SUGGESTED_CATEGORIES.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCategorySave(stock)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCategoryCancel}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleCategoryEdit(stock)}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                                    title="Cliquer pour modifier la catégorie"
                                  >
                                    {capitalizeCategory(getEffectiveCategory(stock))}
                                  </button>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                            {editingQuantityId === stock.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <Input
                                  type="text"
                                  value={tempQuantity}
                                  onChange={(e) => handleQuantityChange(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleQuantitySave(stock)
                                    } else if (e.key === 'Escape') {
                                      handleQuantityCancel()
                                    }
                                  }}
                                  className="w-24 text-right"
                                  autoFocus
                                  disabled={updatingQuantity === stock.id}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleQuantitySave(stock)}
                                  disabled={updatingQuantity === stock.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleQuantityCancel}
                                  disabled={updatingQuantity === stock.id}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQuantityEdit(stock)}
                                className="font-medium hover:text-green-600 transition-colors cursor-pointer"
                                title="Cliquer pour modifier"
                              >
                                {stock.quantity}
                              </button>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUnitId === stock.id ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={tempUnit}
                                  onValueChange={handleUnitChange}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Unité" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SUGGESTED_UNITS.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => handleUnitSave(stock)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleUnitCancel}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUnitEdit(stock)}
                                className="font-medium hover:text-blue-600 transition-colors cursor-pointer"
                                title="Cliquer pour modifier l'unité"
                              >
                                {stock.product.unit}
                              </button>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(stock)}
                                title="Modifier le produit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(stock.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogue de récapitulatif des consommations */}
      <Dialog open={showConsumptionSummary} onOpenChange={setShowConsumptionSummary}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Récapitulatif des consommations
            </DialogTitle>
            <DialogDescription>
              {consumptionSummary?.period} - {consumptionSummary?.totalDishes || 0} plat{(consumptionSummary?.totalDishes || 0) > 1 ? 's' : ''} réalisé{(consumptionSummary?.totalDishes || 0) > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {loadingSummary ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du récapitulatif...</p>
            </div>
          ) : consumptionSummary?.productImpacts?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune consommation récente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recipe summary at the top */}
              {consumptionSummary?.recipeSummary && consumptionSummary.recipeSummary.length > 0 && (
                <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-orange-700 mb-2">
                        {consumptionSummary.totalDishes} {consumptionSummary.totalDishes > 1 ? 'plats réalisés' : 'plat réalisé'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {consumptionSummary.recipeSummary.map((recipe: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white/50 rounded-lg px-4 py-2">
                          <span className="text-lg text-gray-800">{recipe.recipeName}</span>
                          <span className="text-2xl font-bold text-orange-600">
                            × {recipe.portions}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Product impacts details */}
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Détail des ingrédients consommés
                </h3>
              </div>
              
              {consumptionSummary?.productImpacts?.map((impact: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{impact.productName}</CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          -{impact.totalQuantity.toFixed(2)} {impact.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {impact.consumptions.length} utilisation{impact.consumptions.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {impact.consumptions.map((cons: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{cons.consumptionName}</div>
                            <div className="text-gray-600 text-xs">
                              {cons.recipeName} ({cons.portions} portion{cons.portions > 1 ? 's' : ''})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-orange-600">
                              -{cons.quantity.toFixed(2)} {impact.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(cons.date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => {
              setShowConsumptionSummary(false)
              // Rafraîchir les stocks après fermeture du récapitulatif
              fetchStocks()
            }}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        stock={editingStock}
        onClose={handleDialogClose}
      />
    </div>
  )
}
