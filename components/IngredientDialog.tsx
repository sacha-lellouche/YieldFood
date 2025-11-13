'use client'

import { useState, useEffect } from 'react'
import { Ingredient } from '@/types/ingredient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface IngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: Ingredient | null
  onClose: (success?: boolean) => void
}

const UNITS = ['kg', 'g', 'L', 'mL', 'pièce', 'unité', 'boîte', 'sachet', 'paquet']

export function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onClose,
}: IngredientDialogProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name)
      setQuantity(ingredient.quantity.toString())
      setUnit(ingredient.unit)
    } else {
      setName('')
      setQuantity('')
      setUnit('kg')
    }
    setError('')
  }, [ingredient, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('La quantité doit être un nombre positif')
      return
    }

    if (!unit) {
      setError('L\'unité est requise')
      return
    }

    setLoading(true)

    try {
      const url = ingredient
        ? `/api/ingredients/${ingredient.id}`
        : '/api/ingredients'
      
      const method = ingredient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantityNum,
          unit: unit.trim(),
        }),
      })

      if (response.ok) {
        onClose(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ingredient ? 'Modifier l\'ingrédient' : 'Ajouter un ingrédient'}
          </DialogTitle>
          <DialogDescription>
            {ingredient
              ? 'Modifiez les informations de votre ingrédient'
              : 'Ajoutez un nouvel ingrédient à votre stock'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'ingrédient</Label>
              <Input
                id="name"
                placeholder="Ex: Farine, Tomates, Huile d'olive..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <Select value={unit} onValueChange={setUnit} disabled={loading}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'En cours...' : ingredient ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
