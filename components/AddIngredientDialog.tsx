'use client'

import { useState, useEffect } from 'react'
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

interface AddIngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onSuccess?: (ingredient: { id: string; name: string; unit: string }) => void
}

export function AddIngredientDialog({
  open,
  onOpenChange,
  initialName = '',
  onSuccess,
}: AddIngredientDialogProps) {
  const [name, setName] = useState(initialName)
  const [unit, setUnit] = useState('g')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [similarProduct, setSimilarProduct] = useState<string | null>(null)
  const [forceCreate, setForceCreate] = useState(false)

  // Fonction pour deviner la catégorie à partir du nom
  const guessCategory = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase().trim()
    
    // Fruits & Légumes (regroupé)
    if (/pomme|poire|banane|orange|citron|fraise|framboise|myrtille|kiwi|mangue|ananas|melon|pastèque|raisin|cerise|abricot|pêche|prune|figue|datte|avocat|tomate|carotte|pomme de terre|oignon|ail|poivron|courgette|aubergine|concombre|salade|laitue|épinard|chou|brocoli|chou-fleur|haricot vert|petit pois|poireau|céleri|navet|radis|betterave|courge|potiron|potimarron/i.test(name)) {
      return 'Fruits & Légumes'
    }
    
    // Herbes, Aromates & Condiments (regroupé avec huiles)
    if (/persil|basilic|coriandre|menthe|thym|romarin|origan|estragon|ciboulette|aneth|laurier|sauge|huile|vinaigre|moutarde|mayonnaise|ketchup|sauce soja|sauce|condiment/i.test(name)) {
      return 'Herbes, Aromates & Condiments'
    }
    
    // Viandes & Poissons
    if (/viande|bœuf|veau|porc|agneau|poulet|dinde|canard|steak|escalope|filet|côte|saucisse|jambon|bacon|lard|poisson|saumon|thon|cabillaud|dorade|bar|truite|sardine|maquereau|crevette|moule|huître/i.test(name)) {
      return 'Viandes & Poissons'
    }
    
    // Œufs
    if (/œuf|oeuf/i.test(name)) {
      return 'Œufs'
    }
    
    // Produits laitiers
    if (/lait|crème|beurre|fromage|yaourt|yogourt|mozzarella|parmesan|emmental|gruyère|chèvre|brebis|mascarpone|ricotta|feta/i.test(name)) {
      return 'Produits laitiers'
    }
    
    // Pâtes & Riz
    if (/pâte|spaghetti|penne|fusilli|tagliatelle|lasagne|ravioli|riz|risotto|quinoa|boulgour|semoule/i.test(name)) {
      return 'Pâtes & Riz'
    }
    
    // Pain & Farines
    if (/pain|baguette|farine|levure|croissant|brioche|pain de mie/i.test(name)) {
      return 'Pain & Farines'
    }
    
    // Épices
    if (/sel|poivre|paprika|cumin|curry|muscade|cannelle|gingembre|curcuma|piment|safran|vanille|cardamome|clou de girofle/i.test(name)) {
      return 'Épices'
    }
    
    // Sucre & Chocolat
    if (/sucre|miel|chocolat|cacao|confiture|nutella|sirop|caramel/i.test(name)) {
      return 'Sucre & Chocolat'
    }
    
    // Boissons
    if (/eau|jus|soda|coca|thé|café|vin|bière|lait de/i.test(name)) {
      return 'Boissons'
    }
    
    // Conserves
    if (/conserve|boîte|concentré de tomate/i.test(name)) {
      return 'Conserves'
    }
    
    // Surgelés
    if (/surgelé|congelé/i.test(name)) {
      return 'Surgelés'
    }
    
    // Snacks
    if (/chips|biscuit|gâteau|cookie|cracker|céréales petit-déjeuner/i.test(name)) {
      return 'Snacks'
    }
    
    return '' // Pas de catégorie par défaut
  }

  // Mettre à jour le nom et deviner la catégorie quand initialName change
  useEffect(() => {
    if (open && initialName) {
      setName(initialName)
      const suggestedCategory = guessCategory(initialName)
      if (suggestedCategory) {
        setCategory(suggestedCategory)
        setShowCustomCategory(false)
      }
    }
  }, [initialName, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSimilarProduct(null)

    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }

    if (!unit) {
      setError('L\'unité est requise')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          unit: unit,
          category: category && category.trim() ? category.trim() : null,
          low_stock_threshold: parseFloat(lowStockThreshold) || 5,
          force: forceCreate, // Permet de forcer la création
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Ajouter l'ingrédient aux stocks avec une quantité de 0
        try {
          await fetch('/api/stock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: data.id,
              quantity: 0,
            }),
          })
        } catch (stockErr) {
          console.error('Erreur lors de l\'ajout au stock:', stockErr)
          // On continue même si l'ajout au stock échoue
        }
        
        if (onSuccess) {
          onSuccess(data)
        }
        onOpenChange(false)
        // Réinitialiser le formulaire
        setName('')
        setUnit('g')
        setCategory('')
        setCustomCategory('')
        setShowCustomCategory(false)
        setLowStockThreshold('5')
        setForceCreate(false)
        setSimilarProduct(null)
      } else if (response.status === 409) {
        // Produit similaire existe
        const data = await response.json()
        setSimilarProduct(data.existingProduct || 'un produit similaire')
        setError(data.error || 'Un produit similaire existe déjà')
      } else {
        const data = await response.json()
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleForceCreate = () => {
    setForceCreate(true)
    setSimilarProduct(null)
    setError('')
    // Re-soumettre le formulaire
    const form = document.querySelector('form')
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel ingrédient</DialogTitle>
          <DialogDescription>
            Créer un nouvel ingrédient dans le catalogue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm space-y-2">
                <p>{error}</p>
                {similarProduct && (
                  <div className="space-y-2">
                    <p className="text-sm">Produit existant : <strong>{similarProduct}</strong></p>
                    <Button
                      type="button"
                      onClick={handleForceCreate}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={loading}
                    >
                      Créer quand même &quot;{name}&quot;
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'ingrédient *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tomate, Farine, Huile d'olive..."
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Unité */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={unit} onValueChange={setUnit} disabled={loading}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grammes (g)</SelectItem>
                  <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                  <SelectItem value="ml">Millilitres (ml)</SelectItem>
                  <SelectItem value="l">Litres (l)</SelectItem>
                  <SelectItem value="pièce">Pièce</SelectItem>
                  <SelectItem value="unité">Unité</SelectItem>
                  <SelectItem value="bouteille">Bouteille</SelectItem>
                  <SelectItem value="boîte">Boîte</SelectItem>
                  <SelectItem value="sachet">Sachet</SelectItem>
                  <SelectItem value="paquet">Paquet</SelectItem>
                  <SelectItem value="c. à soupe">Cuillère à soupe</SelectItem>
                  <SelectItem value="c. à café">Cuillère à café</SelectItem>
                  <SelectItem value="pincée">Pincée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seuil de stock faible */}
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">
                Seuil de stock faible
                <span className="text-xs text-gray-500 ml-2">(optionnel)</span>
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                step="0.1"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Quantité en dessous de laquelle le stock sera considéré comme faible (par défaut: 5 {unit})
              </p>
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie (optionnel)</Label>
              <Select 
                value={category === '__custom__' || showCustomCategory ? '__custom__' : category} 
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomCategory(true)
                    setCategory('')
                    setCustomCategory('')
                  } else {
                    setShowCustomCategory(false)
                    setCategory(value)
                    setCustomCategory('')
                  }
                }} 
                disabled={loading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Fruits & Légumes */}
                  <SelectItem value="Fruits & Légumes">🍎 Fruits & Légumes</SelectItem>
                  
                  {/* Protéines */}
                  <SelectItem value="Viandes & Poissons">🥩 Viandes & Poissons</SelectItem>
                  <SelectItem value="Œufs">🥚 Œufs</SelectItem>
                  
                  {/* Produits laitiers */}
                  <SelectItem value="Produits laitiers">🥛 Produits laitiers</SelectItem>
                  
                  {/* Féculents */}
                  <SelectItem value="Pâtes & Riz">🍝 Pâtes & Riz</SelectItem>
                  <SelectItem value="Pain & Farines">🥖 Pain & Farines</SelectItem>
                  
                  {/* Épices */}
                  <SelectItem value="Épices">🌶️ Épices</SelectItem>
                  
                  {/* Sucré */}
                  <SelectItem value="Sucre & Chocolat">🍫 Sucre & Chocolat</SelectItem>
                  
                  {/* Boissons */}
                  <SelectItem value="Boissons">🥤 Boissons</SelectItem>
                  
                  {/* Autres */}
                  <SelectItem value="Conserves">🥫 Conserves</SelectItem>
                  <SelectItem value="Surgelés">❄️ Surgelés</SelectItem>
                  <SelectItem value="Snacks">🍪 Snacks</SelectItem>
                  
                  {/* Herbes & Aromates en fin */}
                  <SelectItem value="Herbes, Aromates & Condiments">🌿 Herbes, Aromates & Condiments</SelectItem>
                  
                  <SelectItem value="Autres">📦 Autres</SelectItem>
                  
                  {/* Ajouter une catégorie personnalisée */}
                  <SelectItem value="__custom__">➕ Ajouter une catégorie...</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Champ pour catégorie personnalisée */}
              {showCustomCategory && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="customCategory">Nouvelle catégorie</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value)
                      setCategory(e.target.value)
                    }}
                    placeholder="Ex: Fruits exotiques, Épices rares..."
                    disabled={loading}
                  />
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                La catégorie aide à organiser et filtrer votre catalogue
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter au catalogue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
