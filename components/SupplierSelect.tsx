'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Supplier } from '@/types/supplier'

interface SupplierSelectProps {
  value: string | null
  onChange: (supplierId: string | null) => void
  disabled?: boolean
}

export default function SupplierSelect({ value, onChange, disabled = false }: SupplierSelectProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuppliers()
  }, [])

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
