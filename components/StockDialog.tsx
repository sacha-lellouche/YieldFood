'use client'

import { useState, useEffect } from 'react'
import { StockWithProduct, Product } from '@/types/stock'
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

interface StockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stock: StockWithProduct | null
  onClose: (success?: boolean) => void
}

export function StockDialog({
  open,
  onOpenChange,
  stock,
  onClose,
}: StockDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Charger les produits disponibles
  useEffect(() => {
    if (open && !stock) {
      fetchProducts()
    }
  }, [open, stock])

  // Filtrer les produits selon le terme de recherche
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  useEffect(() => {
    if (stock) {
      setSelectedProductId(stock.product_id)
      setQuantity(stock.quantity.toString())
    } else {
      setSelectedProductId('')
      setQuantity('')
      setProductSearchTerm('')
    }
    setError('')
  }, [stock, open])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedProductId) {
      setError('Veuillez sélectionner un produit')
      return
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('La quantité doit être un nombre positif')
      return
    }

    setLoading(true)

    try {
      if (stock) {
        // Modification d'un stock existant - utiliser l'API d'ajustement
        const deltaQuantity = quantityNum - stock.quantity
        console.log('Adjusting stock:', { product_id: stock.product_id, deltaQuantity })
        const response = await fetch(`/api/stock/${stock.product_id}/adjust`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: deltaQuantity }),
        })

        if (response.ok) {
          onClose(true)
        } else {
          const data = await response.json()
          setError(data.error || 'Une erreur est survenue')
        }
      } else {
        // Création d'un nouveau stock
        console.log('Creating stock:', { product_id: selectedProductId, quantity: quantityNum })
        const response = await fetch('/api/stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: selectedProductId,
            quantity: quantityNum,
          }),
        })

        console.log('Response status:', response.status)
        if (response.ok) {
          onClose(true)
        } else {
          const data = await response.json()
          console.error('Error response:', data)
          setError(data.error || 'Une erreur est survenue')
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stock ? 'Modifier le stock' : 'Ajouter un produit au stock'}
          </DialogTitle>
          <DialogDescription>
            {stock
              ? 'Modifiez la quantité en stock'
              : 'Sélectionnez un produit du catalogue'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Sélection du produit */}
            {!stock && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Rechercher (Tomate, Farine, Huile...)"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      disabled={loading || loadingProducts}
                      className="mb-2"
                    />
                    <Select 
                      value={selectedProductId} 
                      onValueChange={setSelectedProductId}
                      disabled={loading || loadingProducts}
                    >
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {loadingProducts ? (
                          <SelectItem value="loading" disabled>
                            Chargement...
                          </SelectItem>
                        ) : filteredProducts.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            {productSearchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
                          </SelectItem>
                        ) : (
                          filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{product.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {product.unit}
                                  {product.category && ` • ${product.category}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedProductId && selectedProduct && (
                    <p className="text-xs text-gray-500">
                      Unité: {selectedProduct.unit}
                      {selectedProduct.category && ` • Catégorie: ${selectedProduct.category}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Affichage du produit en mode édition */}
            {stock && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium">{stock.product.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Unité: {stock.product.unit}
                  {stock.product.category && ` • ${stock.product.category}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Stock actuel: {stock.quantity} {stock.product.unit}
                </div>
              </div>
            )}

            {/* Quantité */}
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

              {(selectedProductId || stock) && (
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <div className="h-10 px-3 py-2 bg-gray-100 rounded-md flex items-center text-sm font-medium">
                    {stock ? stock.product.unit : selectedProduct?.unit}
                  </div>
                </div>
              )}
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
              {loading ? 'En cours...' : stock ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
