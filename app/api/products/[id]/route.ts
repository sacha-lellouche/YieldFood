import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: productId } = await params
    
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

    if (!productId) {
      return NextResponse.json(
        { error: 'L\'ID du produit est requis' },
        { status: 400 }
      )
    }

    // Récupérer les données du body
    const body = await request.json()
    const { name, unit, category, description, low_stock_threshold } = body

    // Préparer les données de mise à jour
    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (unit !== undefined) updateData.unit = unit.trim()
    if (category !== undefined) updateData.category = category?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold

    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    console.log('Updating product:', productId, 'with data:', updateData)

    // Vérifier que le produit existe d'abord
    const { data: existingProduct, error: checkError } = await supabase
      .from('product')
      .select('id')
      .eq('id', productId)
      .maybeSingle()

    if (checkError) {
      console.error('Erreur lors de la vérification du produit:', checkError)
      return NextResponse.json(
        { error: `Erreur lors de la vérification: ${checkError.message}` },
        { status: 500 }
      )
    }

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le produit
    const { data: product, error: updateError } = await supabase
      .from('product')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour du produit:', updateError)
      console.error('Update data was:', updateData)
      console.error('Product ID was:', productId)
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour du produit: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('Product updated successfully:', product)
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
