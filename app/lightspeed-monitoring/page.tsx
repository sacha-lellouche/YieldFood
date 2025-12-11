'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'

interface StockAlert {
  id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'negative_stock'
  current_stock: number
  minimum_stock: number
  created_at: string
  is_resolved: boolean
  ingredient: {
    name: string
    unit: string
    current_stock: number
  }
}

interface SyncLog {
  id: string
  sync_type: string
  status: 'success' | 'error' | 'partial'
  lightspeed_sale_id: string
  lightspeed_order_number: string
  items_count: number
  ingredients_updated: number
  error_message?: string
  created_at: string
}

interface StockMovement {
  id: string
  movement_type: string
  quantity_change: number
  stock_before: number
  stock_after: number
  reference_order?: string
  created_at: string
  ingredient?: {
    name: string
    unit: string
  }
}

export default function LightspeedMonitoringPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'alerts' | 'logs' | 'movements'>('alerts')
  
  // États
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Statistiques
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSync: null as string | null
  })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchData()
      
      // Actualiser toutes les 30 secondes
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [userId])

  const fetchData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      await Promise.all([
        fetchAlerts(),
        fetchLogs(),
        fetchMovements(),
        fetchStats()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        ingredient:ingredients(name, unit, current_stock)
      `)
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setAlerts(data as StockAlert[])
  }

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setLogs(data as SyncLog[])
  }

  const fetchMovements = async () => {
    const { data } = await supabase
      .from('stock_movements')
      .select(`
        *,
        ingredient:ingredients(name, unit)
      `)
      .eq('user_id', userId)
      .eq('movement_type', 'sale')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setMovements(data as StockMovement[])
  }

  const fetchStats = async () => {
    // Compter les alertes
    const { count: totalAlerts } = await supabase
      .from('stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_resolved', false)

    const { count: criticalAlerts } = await supabase
      .from('stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .in('alert_type', ['out_of_stock', 'negative_stock'])

    // Compter les syncs
    const { count: successfulSyncs } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'success')

    const { count: failedSyncs } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'error')

    // Dernière sync
    const { data: lastSyncData } = await supabase
      .from('sync_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setStats({
      totalAlerts: totalAlerts || 0,
      criticalAlerts: criticalAlerts || 0,
      successfulSyncs: successfulSyncs || 0,
      failedSyncs: failedSyncs || 0,
      lastSync: lastSyncData?.created_at || null
    })
  }

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('stock_alerts')
      .update({ 
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId)

    if (!error) {
      fetchAlerts()
      fetchStats()
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-300'
      case 'negative_stock': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'Rupture'
      case 'negative_stock': return 'Stock négatif'
      case 'low_stock': return 'Stock faible'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <p className="text-center">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monitoring Lightspeed
          </h1>
          <p className="text-gray-600">
            Suivi des synchronisations et des alertes de stock en temps réel
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Alertes actives</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalAlerts}</div>
            {stats.criticalAlerts > 0 && (
              <div className="text-sm text-red-600 mt-1">
                {stats.criticalAlerts} critique{stats.criticalAlerts > 1 ? 's' : ''}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Syncs réussies</div>
            <div className="text-3xl font-bold text-green-600">{stats.successfulSyncs}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Syncs échouées</div>
            <div className="text-3xl font-bold text-red-600">{stats.failedSyncs}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Dernière sync</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.lastSync 
                ? new Date(stats.lastSync).toLocaleTimeString('fr-FR')
                : 'Aucune'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.lastSync 
                ? new Date(stats.lastSync).toLocaleDateString('fr-FR')
                : ''}
            </div>
          </Card>
        </div>

        {/* Bouton actualiser */}
        <div className="mb-6 flex justify-end">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Actualisation...' : '🔄 Actualiser'}
          </Button>
        </div>

        {/* Onglets */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alertes ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Logs de sync ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mouvements ({movements.length})
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                ✅ Aucune alerte active
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {alert.ingredient?.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAlertTypeColor(alert.alert_type)}`}>
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          Stock actuel: <span className="font-semibold">{alert.current_stock} {alert.ingredient?.unit}</span>
                        </div>
                        <div>
                          Seuil minimum: <span className="font-semibold">{alert.minimum_stock} {alert.ingredient?.unit}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(alert.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => resolveAlert(alert.id)}
                      variant="outline"
                      size="sm"
                    >
                      Résoudre
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Commande #{log.lightspeed_order_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Sale ID: {log.lightspeed_sale_id}</div>
                      <div>Articles: {log.items_count}</div>
                      <div>Ingrédients mis à jour: {log.ingredients_updated}</div>
                      {log.error_message && (
                        <div className="text-red-600 mt-2">
                          Erreur: {log.error_message}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="space-y-4">
            {movements.map((movement) => (
              <Card key={movement.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {movement.ingredient?.name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={movement.quantity_change < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} {movement.ingredient?.unit}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>
                          {movement.stock_before} → {movement.stock_after} {movement.ingredient?.unit}
                        </span>
                      </div>
                      {movement.reference_order && (
                        <div>Commande: {movement.reference_order}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(movement.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
