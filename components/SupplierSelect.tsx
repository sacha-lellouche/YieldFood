'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Supplier {
  id: string
  name: string
  contact_email?: string
  contact_phone?: string
  address?: string
}

interface SupplierSelectProps {
  value?: string
  onChange: (supplierId: string | null) => void
  disabled?: boolean
}

export default function SupplierSelect({ value, onChange, disabled }: SupplierSelectProps) {
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
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chargement..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val: string) => onChange(val === 'none' ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sélectionner un fournisseur" />
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
