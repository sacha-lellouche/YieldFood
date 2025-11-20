'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import IngredientAutocomplete from '@/components/IngredientAutocomplete'

interface RecipeIngredient {
  ingredientId?: string
  ingredientName: string
  quantity: number
  unit: string
}

export default function NewRecipePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState('')
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Recipe form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState<number>(4)
  const [prepTime, setPrepTime] = useState<number>(15)
  const [cookTime, setCookTime] = useState<number>(30)

  // Ingredients list
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { ingredientName: '', quantity: 0, unit: 'g' }
  ])

  // Auto-suggest when recipe name changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Only auto-suggest if name is not empty and feature is enabled
    if (name.trim().length >= 3 && autoSuggestEnabled) {
      // Wait 1 second after user stops typing
      debounceTimerRef.current = setTimeout(() => {
        // Only suggest if ingredients are empty or just one empty ingredient
        const hasEmptyIngredients = ingredients.length === 1 && 
          ingredients[0].ingredientName === '' && 
          ingredients[0].quantity === 0

        if (hasEmptyIngredients) {
          handleSuggestWithAI(true) // Pass true to indicate auto-suggestion
        }
      }, 1000)
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [name, autoSuggestEnabled])

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredientName: '', quantity: 0, unit: 'g' }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const handleIngredientSelect = (index: number, suggestion: any) => {
    const updated = [...ingredients]
    updated[index] = {
      ...updated[index],
      ingredientName: suggestion.name,
      unit: suggestion.unit
    }
    setIngredients(updated)
  }

  const handleSuggestWithAI = async (isAutoSuggest = false) => {
    if (!name.trim()) {
      if (!isAutoSuggest) {
        setError('Veuillez entrer un nom de recette pour obtenir des suggestions')
      }
      return
    }

    setSuggesting(true)
    setError('')

    try {
      const response = await fetch('/api/recipes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName: name })
      })

      if (!response.ok) throw new Error('Erreur lors de la suggestion')

      const data = await response.json()
      
      // Transform suggestions to RecipeIngredient format
      const suggested: RecipeIngredient[] = data.ingredients.map((ing: any) => ({
        ingredientName: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      }))

      setIngredients(suggested)
      
      // Disable auto-suggest after first successful suggestion
      if (isAutoSuggest) {
        setAutoSuggestEnabled(false)
      }
    } catch (err) {
      console.error('Erreur suggestion:', err)
      if (!isAutoSuggest) {
        setError('Impossible d\'obtenir des suggestions. Réessayez.')
      }
    } finally {
      setSuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Le nom de la recette est requis')
      setLoading(false)
      return
    }

    const validIngredients = ingredients.filter(
      ing => ing.ingredientName.trim() && ing.quantity > 0
    )

    if (validIngredients.length === 0) {
      setError('Ajoutez au moins un ingrédient valide')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          servings,
          prep_time: prepTime,
          cook_time: cookTime,
          ingredients: validIngredients.map(ing => ({
            ingredient_name: ing.ingredientName.trim(),
            quantity: ing.quantity,
            unit: ing.unit
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      router.push('/recipes')
    } catch (err: any) {
      console.error('Erreur création recette:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux recettes
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Créer une recette</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la recette *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pâtes carbonara"
                    required
                  />
                  {name.trim().length >= 3 && autoSuggestEnabled && (
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Les ingrédients seront suggérés automatiquement...
                    </p>
                  )}
                  {!autoSuggestEnabled && name.trim().length > 0 && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Ingrédients suggérés automatiquement
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Décrivez votre recette..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="servings">Portions</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      value={servings}
                      onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prepTime">Préparation (min)</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      min="0"
                      value={prepTime}
                      onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cookTime">Cuisson (min)</Label>
                    <Input
                      id="cookTime"
                      type="number"
                      min="0"
                      value={cookTime}
                      onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Ingredients with AI Suggestion */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Ingrédients</h2>
                  {suggesting && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Suggestion en cours...</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSuggestWithAI(false)}
                  disabled={suggesting || !name.trim()}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {suggesting ? 'Suggestion...' : 'Suggérer avec IA'}
                </Button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <IngredientAutocomplete
                        value={ingredient.ingredientName}
                        onChange={(value) =>
                          handleIngredientChange(index, 'ingredientName', value)
                        }
                        onSelect={(suggestion) => handleIngredientSelect(index, suggestion)}
                        placeholder="Nom de l'ingrédient"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Qté"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity || ''}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="w-24">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="pièce">pièce</option>
                        <option value="c. à soupe">c. à soupe</option>
                        <option value="c. à café">c. à café</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={ingredients.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIngredient}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un ingrédient
                </Button>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Enregistrement...' : 'Enregistrer la recette'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
