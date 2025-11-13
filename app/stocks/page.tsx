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
import { Plus, Pencil, Trash2, Search, Package, Minus } from 'lucide-react'
import { StockDialog } from '@/components/StockDialog'

export default function StocksPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stocks, setStocks] = useState<StockWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<StockWithProduct | null>(null)
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null)

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

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'text-red-600', label: 'Rupture' }
    if (quantity < 5) return { color: 'text-orange-600', label: 'Bas' }
    return { color: 'text-green-600', label: 'OK' }
  }

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
          <Button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter un produit
          </Button>
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
                {stocks.filter((s) => s.quantity > 0 && s.quantity < 5).length}
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

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher</CardTitle>
            <CardDescription>Filtrer par nom de produit ou catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Rechercher
              </Button>
              {search && (
                <Button
                  onClick={() => {
                    setSearch('')
                    fetchStocks()
                  }}
                  variant="ghost"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Stocks</CardTitle>
            <CardDescription>
              {stocks.length} produit{stocks.length !== 1 ? 's' : ''} en stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : stocks.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Aucun stock
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par ajouter des produits à votre inventaire
                </p>
                <Button
                  onClick={handleAdd}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => {
                      const status = getStockStatus(stock.quantity)
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            {stock.product.name}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {stock.product.category || 'Non catégorisé'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {stock.quantity}
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
                                onClick={() => adjustQuantity(stock, -1)}
                                disabled={updatingQuantity === stock.id || stock.quantity === 0}
                                title="Retirer 1"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustQuantity(stock, 1)}
                                disabled={updatingQuantity === stock.id}
                                title="Ajouter 1"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(stock)}
                                title="Modifier"
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
