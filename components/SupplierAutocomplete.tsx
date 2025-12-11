'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin, Store, Star } from 'lucide-react'

interface Suggestion {
  place_id: string
  name: string
  formatted_address: string
  types: string[]
  rating?: number | null
  user_ratings_total?: number | null
}

interface SupplierAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (placeId: string, name: string) => void
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

export default function SupplierAutocomplete({
  value,
  onChange,
  onSelect,
  disabled = false,
  required = false,
  placeholder = 'Ex: Carrefour, Intermarché, Picard...',
}: SupplierAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fermer les suggestions si on clique à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Rechercher les suggestions avec un délai (debounce)
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/suppliers/autocomplete?q=${encodeURIComponent(value)}`)
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
    }, 200)

    return () => clearTimeout(timer)
  }, [value])

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.name)
    onSelect(suggestion.place_id, suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
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
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Store className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{suggestion.name}</span>
                    {suggestion.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0">
                        <Star className="h-3 w-3 fill-amber-600" />
                        <span className="font-medium">{suggestion.rating.toFixed(1)}</span>
                        {suggestion.user_ratings_total && (
                          <span className="text-gray-400">({suggestion.user_ratings_total})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {suggestion.formatted_address && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{suggestion.formatted_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          Aucun résultat trouvé
        </div>
      )}
    </div>
  )
}
