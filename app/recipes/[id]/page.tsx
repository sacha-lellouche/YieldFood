'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Save, ArrowLeft, Edit2, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import IngredientAutocomplete from '@/components/IngredientAutocomplete'

interface RecipeIngredient {
  id?: string
  ingredient_name: string
  quantity: number
  unit: string
}

interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number
  prep_time: number | null
  cook_time: number | null
  ingredients: RecipeIngredient[]
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')

  // Form fields for editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState<number>(4)
  const [prepTime, setPrepTime] = useState<number>(15)
  const [cookTime, setCookTime] = useState<number>(30)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])

  useEffect(() => {
    if (id) {
      fetchRecipe()
    }
  }, [id])

  const fetchRecipe = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${id}`)
      
      if (!response.ok) {
        throw new Error('Recette non trouvée')
      }

      const data = await response.json()
      setRecipe(data)
      
      // Initialize form fields
      setName(data.name)
      setDescription(data.description || '')
      setServings(data.servings)
      setPrepTime(data.prep_time || 0)
      setCookTime(data.cook_time || 0)
      setIngredients(data.ingredients)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredient_name: '', quantity: 0, unit: 'g' }])
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
      ingredient_name: suggestion.name,
      unit: suggestion.unit
    }
    setIngredients(updated)
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)

    // Validation
    if (!name.trim()) {
      setError('Le nom de la recette est requis')
      setSaving(false)
      return
    }

    const validIngredients = ingredients.filter(
      ing => ing.ingredient_name.trim() && ing.quantity > 0
    )

    if (validIngredients.length === 0) {
      setError('Ajoutez au moins un ingrédient valide')
      setSaving(false)
      return
    }

    try {
      // Update recipe
      const recipeResponse = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          servings,
          prep_time: prepTime,
          cook_time: cookTime,
          ingredients: validIngredients.map(ing => ({
            ingredient_name: ing.ingredient_name.trim(),
            quantity: ing.quantity,
            unit: ing.unit
          }))
        })
      })

      if (!recipeResponse.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Refresh data
      await fetchRecipe()
      setIsEditing(false)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (recipe) {
      setName(recipe.name)
      setDescription(recipe.description || '')
      setServings(recipe.servings)
      setPrepTime(recipe.prep_time || 0)
      setCookTime(recipe.cook_time || 0)
      setIngredients(recipe.ingredients)
    }
    setIsEditing(false)
    setError('')
  }

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/recipes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux recettes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux recettes
          </Link>
          
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Modifier
            </Button>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <>
              <Card className="p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{recipe?.name}</h1>
                
                {recipe?.description && (
                  <p className="text-gray-600 mb-6">{recipe.description}</p>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Portions</p>
                    <p className="text-2xl font-bold text-green-600">{recipe?.servings}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Préparation</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatTime(recipe?.prep_time || null)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cuisson</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatTime(recipe?.cook_time || null)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Ingrédients</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Pour 1 personne
                  </span>
                </div>
                <div className="space-y-2">
                  {recipe?.ingredients.map((ing, index) => {
                    const quantityPerPerson = recipe.servings > 0 
                      ? (ing.quantity / recipe.servings).toFixed(2).replace(/\.?0+$/, '')
                      : ing.quantity
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium">{ing.ingredient_name}</span>
                        <span className="text-gray-600">
                          {quantityPerPerson} {ing.unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </>
          ) : (
            // Edit Mode
            <form className="space-y-6">
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

              {/* Ingredients */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Ingrédients</h2>

                <div className="space-y-3">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <IngredientAutocomplete
                          value={ingredient.ingredient_name}
                          onChange={(value) =>
                            handleIngredientChange(index, 'ingredient_name', value)
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
