'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { StockWithProduct, StockAdjustmentResponse } from '@/types/stock'
import { StockQuantityAdjuster } from '@/components/StockQuantityAdjuster'
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
import { Package, Search, AlertCircle } from 'lucide-react'

export default function StockManagementPage() {
  const { user } = useAuth()
  const [stocks, setStocks] = useState<StockWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (user) {
      fetchStocks()
    }
  }, [user])

  const fetchStocks = async () => {
    try {
      setLoading(true)
      // Cette route devrait retourner les stocks avec les informations des produits
      const response = await fetch('/api/stock')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des stocks')
      }

      const data = await response.json()
      setStocks(data)
    } catch (error) {
      console.error('Error fetching stocks:', error)
      showNotification('Erreur lors du chargement des stocks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustmentComplete = (response: StockAdjustmentResponse) => {
    // Rafraîchir les stocks
    fetchStocks()
    
    // Afficher une notification
    showNotification(response.message, 'success')
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const filteredStocks = stocks.filter(stock => 
    stock.product.name.toLowerCase().includes(search.toLowerCase()) ||
    stock.product.category?.toLowerCase().includes(search.toLowerCase())
  )

  const getTotalValue = () => {
    return filteredStocks.reduce((sum, stock) => sum + stock.quantity, 0)
  }

  const getLowStockCount = () => {
    // Produits avec moins de 5 unités (ajustable selon vos besoins)
    return filteredStocks.filter(stock => stock.quantity < 5).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des stocks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stocks.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Stock Bas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 flex items-center gap-2">
                {getLowStockCount()}
                {getLowStockCount() > 0 && <AlertCircle className="h-6 w-6" />}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Quantité Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{getTotalValue().toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Stock Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                  <Package className="h-8 w-8" />
                  Gestion des Stocks
                </CardTitle>
                <CardDescription className="mt-2">
                  Ajustez vos quantités en temps réel avec +/- 
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stock Table */}
            {filteredStocks.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {search ? 'Aucun produit trouvé' : 'Aucun stock'}
                </p>
                <p className="text-gray-400">
                  {search ? 'Essayez une autre recherche' : 'Commencez par ajouter des produits'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Quantité Actuelle</TableHead>
                      <TableHead>Ajustement</TableHead>
                      <TableHead>Dernière MAJ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => (
                      <TableRow key={stock.id} className={stock.quantity < 5 ? 'bg-orange-50' : ''}>
                        <TableCell className="font-medium">
                          {stock.product.name}
                          {stock.quantity < 5 && (
                            <span className="ml-2 text-xs text-orange-600 font-semibold">
                              ⚠ Stock bas
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {stock.product.category || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {stock.quantity} {stock.product.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StockQuantityAdjuster
                            stock={stock}
                            onAdjustmentComplete={handleAdjustmentComplete}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(stock.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
