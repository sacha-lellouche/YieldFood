'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, Plus } from 'lucide-react'

interface IngredientSuggestion {
  id?: string
  name: string
  unit: string
  category?: string
  source: 'catalog' | 'history'
}

interface IngredientAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: IngredientSuggestion) => void
  onAddNew?: (name: string) => void
  placeholder?: string
  className?: string
  showAddButton?: boolean
}

export default function IngredientAutocomplete({
  value,
  onChange,
  onSelect,
  onAddNew,
  placeholder = "Nom de l'ingrédient",
  className = '',
  showAddButton = true
}: IngredientAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fermer les suggestions si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Rechercher les suggestions avec debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(value)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setShowSuggestions(data.length > 0)
        }
      } catch (error) {
        console.error('Erreur lors de la recherche:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value])

  const handleSelect = (suggestion: IngredientSuggestion) => {
    onChange(suggestion.name)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    if (onSelect) {
      onSelect(suggestion)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Si pas de suggestions et Entrée, proposer d'ajouter
      if (e.key === 'Enter' && value.trim().length >= 2 && showAddButton && onAddNew) {
        e.preventDefault()
        onAddNew(value.trim())
        return
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.source}-${suggestion.id || suggestion.name}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors
                flex items-center justify-between
                ${index === selectedIndex ? 'bg-green-50' : ''}
              `}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {suggestion.name}
                </div>
                {suggestion.category && (
                  <div className="text-xs text-gray-500">
                    {suggestion.category}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {suggestion.unit}
                </span>
                {suggestion.source === 'catalog' ? (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Catalogue
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Historique
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Afficher le bouton "Ajouter" si pas de résultats et assez de caractères */}
      {showAddButton && onAddNew && value.trim().length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <button
            type="button"
            onClick={() => onAddNew(value.trim())}
            className="w-full px-3 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 border-b border-gray-100"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <Plus className="h-4 w-4 text-green-700" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Ajouter "{value.trim()}"
              </div>
              <div className="text-xs text-gray-500">
                Créer un nouvel ingrédient
              </div>
            </div>
          </button>
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
            💡 Aucun résultat trouvé dans le catalogue
          </div>
        </div>
      )}
    </div>
  )
}
