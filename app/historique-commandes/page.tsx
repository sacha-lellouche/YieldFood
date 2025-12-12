'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Calendar, MapPin, ShoppingCart, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Order } from '@/types/order'

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ordered: { label: 'Commandé', color: 'bg-blue-100 text-blue-800', icon: ShoppingCart },
      received: { label: 'Reçu', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-indigo-600" />
                  Historique des Commandes
                </CardTitle>
                <CardDescription className="mt-2">
                  Consultez toutes vos commandes passées
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">{orders.length}</div>
                <div className="text-sm text-gray-600">Commande{orders.length > 1 ? 's' : ''}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Liste des commandes */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucune commande pour le moment</p>
              <p className="text-gray-400 text-sm mt-2">
                Les commandes générées apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id)
              const totalItems = (order.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0)

              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-xl text-indigo-700">
                            {(order as any).supplier ? (order as any).supplier.name : 'Commande'}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {formatDate(order.order_date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="h-4 w-4" />
                          <span className="text-sm">
                            {order.items?.length || 0} produit{(order.items?.length || 0) > 1 ? 's' : ''} • {totalItems.toFixed(1)} unité{totalItems > 1 ? 's' : ''} au total
                          </span>
                        </div>

                        {order.notes && (
                          <p className="text-sm text-gray-500 italic mt-2">{order.notes}</p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="ml-4"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && order.items && order.items.length > 0 && (
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">
                          Détails de la commande :
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">
                                  Produit
                                </th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase">
                                  Quantité
                                </th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase">
                                  Unité
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {order.items.map((item: any, index: number) => (
                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {item.product?.name || 'Produit inconnu'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                    {item.unit}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
