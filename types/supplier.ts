export interface Supplier {
  id: string
  user_id: string
  name: string
  location: string | null
  contact: string | null
  phone: string | null
  email: string | null
  opening_hours: string | null
  specialties: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
