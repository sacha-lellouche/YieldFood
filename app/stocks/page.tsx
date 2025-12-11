'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { StockWithProduct } from '@/types/stock'
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
import { Plus, Pencil, Trash2, Search, Package, Minus, Filter, ArrowUpDown, ShoppingCart } from 'lucide-react'
import { StockDialog } from '@/components/StockDialog'
import SupplierSelect from '@/components/SupplierSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function StocksPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stocks, setStocks] = useState<StockWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'category'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<StockWithProduct | null>(null)
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null)
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [tempQuantity, setTempQuantity] = useState<string>('')
  const [generatingOrders, setGeneratingOrders] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchStocks()
    }
  }, [user])

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

  // Fonction pour obtenir l'emoji/icône d'un ingrédient
  const getIngredientEmoji = (name: string, category: string | null) => {
    const lowerName = name.toLowerCase()
    
    // Mapping spécifique par nom d'ingrédient
    const emojiMap: Record<string, string> = {
      // Fruits
      'pomme': '🍎', 'poire': '🍐', 'banane': '🍌', 'orange': '🍊', 
      'citron': '🍋', 'fraise': '🍓', 'raisin': '🍇', 'pastèque': '🍉',
      'melon': '🍈', 'cerise': '🍒', 'pêche': '🍑', 'ananas': '🍍',
      'kiwi': '🥝', 'avocat': '🥑', 'mangue': '🥭', 'noix de coco': '🥥',
      
      // Légumes
      'tomate': '🍅', 'carotte': '🥕', 'brocoli': '🥦', 'salade': '🥬',
      'laitue': '🥬', 'poivron': '🫑', 'concombre': '🥒', 'aubergine': '🍆',
      'pomme de terre': '🥔', 'patate': '🥔', 'maïs': '🌽', 'piment': '🌶️',
      'champignon': '🍄', 'oignon': '🧅', 'ail': '🧄',
      
      // Protéines
      'poulet': '🍗', 'viande': '🥩', 'boeuf': '🥩', 'porc': '🥓',
      'bacon': '🥓', 'lardons': '🥓', 'jambon': '🥓', 'saucisse': '🌭',
      'poisson': '🐟', 'saumon': '🐟', 'thon': '🐟', 'crevette': '🦐',
      'œuf': '🥚', 'oeuf': '🥚', 'œufs': '🥚', 'oeufs': '🥚',
      
      // Produits laitiers
      'lait': '🥛', 'fromage': '🧀', 'beurre': '🧈', 'crème': '🥛',
      'yaourt': '🥛', 'mozzarella': '🧀', 'parmesan': '🧀', 'emmental': '🧀',
      
      // Céréales et pâtes
      'pain': '🍞', 'baguette': '🥖', 'pâtes': '🍝', 'riz': '🍚',
      'farine': '🌾', 'blé': '🌾', 'avoine': '🌾', 'quinoa': '🌾',
      
      // Sucreries et desserts
      'gâteau': '🍰', 'chocolat': '🍫', 'cookie': '🍪', 'bonbon': '🍬',
      'sucre': '🧁', 'miel': '🍯', 'confiture': '🍯',
      
      // Boissons
      'café': '☕', 'thé': '🍵', 'vin': '🍷', 'bière': '🍺',
      'eau': '💧', 'jus': '🧃', 'soda': '🥤',
      
      // Condiments et épices
      'huile': '🫒', "huile d'olive": '🫒', 'vinaigre': '🧴',
      'sel': '🧂', 'poivre': '🧂', 'épice': '🌶️', 'herbes': '🌿',
      'basilic': '🌿', 'persil': '🌿', 'coriandre': '🌿', 'menthe': '🌿',
      'curry': '🌶️', 'paprika': '🌶️', 'cannelle': '🌰',
      
      // Fruits à coque
      'noix': '🥜', 'noisette': '🌰', 'amande': '🥜', 'cacahuète': '🥜',
      'pistache': '🥜',
    }
    
    // Chercher une correspondance exacte
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowerName.includes(key)) {
        return emoji
      }
    }
    
    // Fallback par catégorie
    if (category) {
      const lowerCategory = category.toLowerCase()
      if (lowerCategory.includes('fruit')) return '🍎'
      if (lowerCategory.includes('légume')) return '🥬'
      if (lowerCategory.includes('viande') || lowerCategory.includes('poisson')) return '🥩'
      if (lowerCategory.includes('lait') || lowerCategory.includes('produit laitier')) return '🥛'
      if (lowerCategory.includes('céréale') || lowerCategory.includes('féculent')) return '🌾'
      if (lowerCategory.includes('épice') || lowerCategory.includes('condiment')) return '🧂'
      if (lowerCategory.includes('boisson')) return '🥤'
      if (lowerCategory.includes('sucre') || lowerCategory.includes('dessert')) return '🍰'
    }
    
    // Emoji par défaut
    return '🥘'
  }

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(stocks.map(s => s.product.category).filter(Boolean)))

  // Filtrer et trier les stocks
  const filteredAndSortedStocks = stocks
    .filter(stock => {
      // Filtre par recherche
      if (search && !stock.product.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Filtre par catégorie
      if (categoryFilter !== 'all' && stock.product.category !== categoryFilter) {
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
          const catA = a.product.category || 'Zzz'
          const catB = b.product.category || 'Zzz'
          comparison = catA.localeCompare(catB)
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
          <div className="flex gap-3">
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
                        {cat}
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
                    Catégorie: {categoryFilter}
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
                    {filteredAndSortedStocks.map((stock) => {
                      const threshold = stock.product.low_stock_threshold || 5
                      const status = getStockStatus(stock.quantity, threshold)
                      const emoji = getIngredientEmoji(stock.product.name, stock.product.category)
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{emoji}</span>
                              <span>{stock.product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[200px]">
                              <SupplierSelect
                                value={stock.supplier_id}
                                onChange={(supplierId) => handleSupplierChange(stock.id, stock.product_id, supplierId)}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {stock.product.category || 'Non catégorisé'}
                            </span>
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
                          <TableCell>{stock.product.unit}</TableCell>
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
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        stock={editingStock}
        onClose={handleDialogClose}
      />
    </div>
  )
}
