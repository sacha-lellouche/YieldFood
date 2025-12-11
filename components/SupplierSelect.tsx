'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Supplier } from '@/types/supplier'

interface SupplierSelectProps {
  value: string | null
  onChange: (supplierId: string | null) => void
  disabled?: boolean
  suppliers?: Supplier[] // Accepter les fournisseurs en props (optionnel)
}

export default function SupplierSelect({ value, onChange, disabled = false, suppliers: suppliersProp }: SupplierSelectProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(suppliersProp || [])
  const [loading, setLoading] = useState(!suppliersProp) // Ne charger que si pas de props

  useEffect(() => {
    // Mettre à jour si les props changent
    if (suppliersProp) {
      setSuppliers(suppliersProp)
      setLoading(false)
    }
  }, [suppliersProp])

  useEffect(() => {
    // Ne faire l'appel API que si les fournisseurs ne sont pas fournis en props
    if (!suppliersProp) {
      fetchSuppliers()
    }
  }, [suppliersProp])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val: string) => onChange(val === 'none' ? null : val)}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Chargement...' : 'Sélectionner un fournisseur'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun fournisseur</SelectItem>
        {suppliers.map((supplier) => (
          <SelectItem key={supplier.id} value={supplier.id}>
            {supplier.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
