'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus } from 'lucide-react'
import { StockWithProduct, StockAdjustmentResponse } from '@/types/stock'

interface StockQuantityAdjusterProps {
  stock: StockWithProduct
  onAdjustmentComplete?: (response: StockAdjustmentResponse) => void
}

export function StockQuantityAdjuster({ stock, onAdjustmentComplete }: StockQuantityAdjusterProps) {
  const [quantity, setQuantity] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleAdjust = async (isAddition: boolean) => {
    setLoading(true)
    setError('')

    try {
      const adjustmentQuantity = isAddition ? quantity : -quantity

      const response = await fetch(`/api/stock/${stock.product_id}/adjust`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustmentQuantity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajustement')
      }

      // Réinitialiser le formulaire
      setQuantity(1)

      // Callback de succès
      if (onAdjustmentComplete) {
        onAdjustmentComplete(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-20 text-center"
        disabled={loading}
      />
      <span className="text-sm text-gray-600">{stock.product.unit}</span>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAdjust(false)}
        disabled={loading || quantity > stock.quantity}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Retirer du stock"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAdjust(true)}
        disabled={loading}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Ajouter au stock"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  )
}
