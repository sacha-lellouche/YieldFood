'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Supplier } from '@/types/supplier'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Store, MapPin, User, Phone, Mail, Trash2, Edit2, X, Loader2 } from 'lucide-react'
import SupplierAutocomplete from '@/components/SupplierAutocomplete'

export default function SuppliersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchingOnline, setSearchingOnline] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact: '',
    phone: '',
    email: '',
    opening_hours: '',
    specialties: '',
    notes: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchSuppliers()
    }
  }, [user, search])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/suppliers', window.location.origin)
      if (search) {
        url.searchParams.append('search', search)
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        console.error('Erreur lors de la récupération des fournisseurs')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        location: supplier.location || '',
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        opening_hours: supplier.opening_hours || '',
        specialties: supplier.specialties || '',
        notes: supplier.notes || '',
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        name: '',
        location: '',
        contact: '',
        phone: '',
        email: '',
        opening_hours: '',
        specialties: '',
        notes: '',
      })
    }
    setError('')
    setManualEntry(false)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSupplier(null)
    setManualEntry(false)
    setError('')
  }

  const handleSupplierSelect = async (placeId: string, name: string) => {
    if (placeId === 'manual') {
      // Pas de pré-remplissage, juste garder le nom
      return
    }

    setSearchingOnline(true)
    setError('')

    try {
      const response = await fetch(`/api/suppliers/details?place_id=${encodeURIComponent(placeId)}`)

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails')
      }

      const data = await response.json()

      // Mettre à jour le formulaire avec les données trouvées
      setFormData({
        name: data.name || name,
        location: data.location || formData.location,
        contact: formData.contact, // On garde le contact existant
        phone: data.phone || formData.phone,
        email: data.website || formData.email,
        opening_hours: data.opening_hours || formData.opening_hours,
        specialties: data.specialties || formData.specialties,
        notes: formData.notes, // On garde les notes existantes
      })
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les détails')
    } finally {
      setSearchingOnline(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = editingSupplier
        ? `/api/suppliers?id=${editingSupplier.id}`
        : '/api/suppliers'
      
      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      await fetchSuppliers()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      return
    }

    try {
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuppliers(suppliers.filter((s) => s.id !== id))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center gap-2">
                  <Store className="h-8 w-8" />
                  Mes Fournisseurs
                </CardTitle>
                <CardDescription className="mt-2">
                  Gérez vos contacts et fournisseurs
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleOpenDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un fournisseur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    {!editingSupplier && !manualEntry && (
                      <div>
                        <Label htmlFor="name">Nom du fournisseur *</Label>
                        <SupplierAutocomplete
                          value={formData.name}
                          onChange={(value) => setFormData({ ...formData, name: value })}
                          onSelect={handleSupplierSelect}
                          required
                          placeholder="Ex: Carrefour, Intermarché, Picard..."
                        />
                        {searchingOnline && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Récupération des informations...</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            💡 Tapez le nom du fournisseur et sélectionnez-le dans la liste
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setManualEntry(true)}
                            className="text-green-600 hover:text-green-700 h-auto p-0"
                          >
                            Ou créer manuellement →
                          </Button>
                        </div>
                      </div>
                    )}

                    {(!editingSupplier && manualEntry) && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="name">Nom du fournisseur *</Label>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setManualEntry(false)}
                            className="text-gray-600 hover:text-gray-700 h-auto p-0"
                          >
                            ← Retour à la recherche
                          </Button>
                        </div>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Marché Bio du Centre"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ✍️ Saisie manuelle - remplissez tous les champs vous-même
                        </p>
                      </div>
                    )}

                    {editingSupplier && (
                      <div>
                        <Label htmlFor="name">Nom du fournisseur *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Marché Bio du Centre"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="location">Adresse / Lieu</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ex: 123 Rue de la République, 75001 Paris"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact">Personne de contact</Label>
                        <Input
                          id="contact"
                          value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                          placeholder="Ex: Jean Dupont"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Ex: 01 23 45 67 89"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ex: contact@fournisseur.fr"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Notes personnelles..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        disabled={saving}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher un fournisseur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Liste des fournisseurs */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des fournisseurs...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {search ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}
                </p>
                <p className="text-gray-400 mb-4">
                  {search
                    ? 'Essayez une autre recherche'
                    : 'Commencez par ajouter vos fournisseurs'}
                </p>
                {!search && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleOpenDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un fournisseur
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(supplier)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {supplier.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{supplier.location}</span>
                        </div>
                      )}
                      {supplier.contact && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">{supplier.contact}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-green-600 hover:underline"
                          >
                            {supplier.phone}
                          </a>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`mailto:${supplier.email}`}
                            className="text-green-600 hover:underline truncate"
                          >
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.notes && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-gray-600 text-xs italic">{supplier.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Statistiques */}
            {suppliers.length > 0 && (
              <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Total de fournisseurs</p>
                <p className="text-2xl font-bold text-green-700">{suppliers.length}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
