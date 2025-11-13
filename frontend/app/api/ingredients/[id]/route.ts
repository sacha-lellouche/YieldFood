import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// PUT /api/ingredients/[id] - Met à jour un ingrédient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer et valider les données
    const body = await request.json()
    const { name, quantity, unit } = body

    // Construire l'objet de mise à jour
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity < 0) {
        return NextResponse.json(
          { error: 'La quantité doit être un nombre positif' },
          { status: 400 }
        )
      }
      updates.quantity = quantity
    }
    if (unit !== undefined) updates.unit = unit.trim()

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // Mettre à jour l'ingrédient (RLS s'assure que c'est le bon user)
    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ingredient:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'ingrédient' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Ingrédient non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/ingredients/[id] - Supprime un ingrédient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Supprimer l'ingrédient (RLS s'assure que c'est le bon user)
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting ingredient:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'ingrédient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Ingrédient supprimé avec succès' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
