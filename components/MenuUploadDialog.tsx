'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, CheckCircle2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MenuUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface DetectedDish {
  name: string
  category: string
  description: string
  price?: number
  ingredients: string[]
}

export default function MenuUploadDialog({ open, onOpenChange, onSuccess }: MenuUploadDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [detectedDishes, setDetectedDishes] = useState<DetectedDish[]>([])
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload')

  console.log('MenuUploadDialog render, open:', open)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('menu', file)

      const response = await fetch('/api/recipes/analyze-menu', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const data = await response.json()
      setDetectedDishes(data.dishes || [])
      setStep('review')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'analyse de la carte. Veuillez réessayer.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImport = async () => {
    if (!user || detectedDishes.length === 0) return

    console.log('Import de', detectedDishes.length, 'recettes')
    setImporting(true)
    try {
      const response = await fetch('/api/recipes/import-from-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes: detectedDishes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        throw new Error(errorData.error || 'Erreur lors de l\'import')
      }

      const data = await response.json()
      console.log('Import réussi:', data)
      setStep('success')
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        // Reset
        setFile(null)
        setDetectedDishes([])
        setStep('upload')
      }, 2000)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'import des recettes. Veuillez réessayer.')
    } finally {
      setImporting(false)
    }
  }

  const removeDish = (index: number) => {
    setDetectedDishes(detectedDishes.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Uploader ma carte</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Téléchargez une photo de votre carte, l\'IA analysera automatiquement vos plats'}
            {step === 'review' && 'Vérifiez et ajustez les plats détectés avant l\'import'}
            {step === 'success' && 'Recettes importées avec succès !'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="menu-upload"
              />
              <label htmlFor="menu-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  {file ? file.name : 'Cliquez pour sélectionner une image'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG jusqu'à 10MB
                </p>
              </label>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analyser ma carte
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✨ {detectedDishes.length} plat(s) détecté(s) ! Vérifiez les détails et supprimez ceux que vous ne souhaitez pas importer.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detectedDishes.map((dish, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {dish.category}
                        </span>
                        {dish.price && (
                          <span className="text-sm text-gray-600">{dish.price}€</span>
                        )}
                      </div>
                      {dish.description && (
                        <p className="text-sm text-gray-600 mb-2">{dish.description}</p>
                      )}
                      {dish.ingredients && dish.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dish.ingredients.map((ingredient, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeDish(index)}
                      className="ml-4 p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || detectedDishes.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  `Importer ${detectedDishes.length} recette(s)`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Recettes importées !
            </h3>
            <p className="text-gray-600">
              Vous pouvez maintenant les modifier dans "Mes Recettes"
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
