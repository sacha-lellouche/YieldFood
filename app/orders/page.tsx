'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, AlertCircle, CheckCircle, Package, Truck } from 'lucide-react'
import { StockWithProduct } from '@/types/stock'
import { Supplier } from '@/types/supplier'

interface OrderPreview {
  supplier: Supplier
  items: Array<{
    product: StockWithProduct['product']
    currentQuantity: number
    orderQuantity: number
  }>
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orderPreviews, setOrderPreviews] = useState<OrderPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      generateOrderPreviews()
    }
  }, [user])

  const generateOrderPreviews = async () => {
    try {
      setLoading(true)
      
      // Récupérer tous les stocks
      const stockResponse = await fetch('/api/stock')
      if (!stockResponse.ok) throw new Error('Erreur lors de la récupération des stocks')
      const stocks: StockWithProduct[] = await stockResponse.json()

      // Récupérer tous les fournisseurs
      const supplierResponse = await fetch('/api/suppliers')
      if (!supplierResponse.ok) throw new Error('Erreur lors de la récupération des fournisseurs')
      const suppliers: Supplier[] = await supplierResponse.json()

      // Filtrer les produits en rupture de stock (quantité <= seuil)
      const lowStockItems = stocks.filter((stock) => {
        const threshold = stock.product.low_stock_threshold || 5
        return stock.quantity <= threshold && stock.supplier_id
      })

      // Grouper par fournisseur
      const grouped = new Map<string, OrderPreview>()

      lowStockItems.forEach((stock) => {
        if (!stock.supplier_id) return

        const supplier = suppliers.find((s) => s.id === stock.supplier_id)
        if (!supplier) return

        if (!grouped.has(stock.supplier_id)) {
          grouped.set(stock.supplier_id, {
            supplier,
            items: [],
          })
        }

        const orderPreview = grouped.get(stock.supplier_id)!
        const threshold = stock.product.low_stock_threshold || 5
        const orderQuantity = threshold * 2 - stock.quantity // Commander pour remonter à 2x le seuil

        orderPreview.items.push({
          product: stock.product,
          currentQuantity: stock.quantity,
          orderQuantity: Math.max(1, orderQuantity),
        })
      })

      setOrderPreviews(Array.from(grouped.values()))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrders = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des commandes')
      }

      const data = await response.json()
      alert(`${data.ordersCreated} commande(s) créée(s) avec succès !`)
      
      // Rafraîchir la page
      await generateOrderPreviews()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création des commandes')
    } finally {
      setGenerating(false)
    }
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
        {/* En-tête */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                  <ShoppingCart className="h-8 w-8" />
                  Commandes Automatiques
                </CardTitle>
                <CardDescription className="mt-2">
                  Générez automatiquement des commandes pour les produits en rupture de stock
                </CardDescription>
              </div>
              {orderPreviews.length > 0 && (
                <Button
                  onClick={handleCreateOrders}
                  disabled={generating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Générer toutes les commandes
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : orderPreviews.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucune commande nécessaire
                </h3>
                <p className="text-gray-600 mb-4">
                  Tous vos produits ont un stock suffisant ou n'ont pas de fournisseur associé.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/stocks')}
                    variant="outline"
                  >
                    Voir mes stocks
                  </Button>
                  <Button
                    onClick={() => router.push('/suppliers')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Gérer mes fournisseurs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Résumé */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fournisseurs</p>
                      <p className="text-2xl font-bold text-gray-900">{orderPreviews.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Produits à commander</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {orderPreviews.reduce((sum, op) => sum + op.items.length, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Truck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Commandes à créer</p>
                      <p className="text-2xl font-bold text-gray-900">{orderPreviews.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des commandes par fournisseur */}
            {orderPreviews.map((orderPreview) => (
              <Card key={orderPreview.supplier.id}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                        {orderPreview.supplier.name}
                      </CardTitle>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {orderPreview.supplier.phone && (
                          <p>📞 {orderPreview.supplier.phone}</p>
                        )}
                        {orderPreview.supplier.email && (
                          <p>✉️ {orderPreview.supplier.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Articles</p>
                      <p className="text-3xl font-bold text-green-600">
                        {orderPreview.items.length}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {orderPreview.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Stock actuel: <span className="text-orange-600 font-medium">{item.currentQuantity}</span> {item.product.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">À commander</p>
                          <p className="text-lg font-bold text-green-600">
                            {item.orderQuantity} {item.product.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
