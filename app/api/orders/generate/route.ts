import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/orders/generate
 * Génère automatiquement des commandes pour les produits en rupture de stock
 */
export async function POST(request: NextRequest) {
  try {
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

    // Récupérer tous les stocks avec les produits et fournisseurs
    const { data: stocks, error: stockError } = await supabase
      .from('stock')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        supplier_id,
        product:product_id (
          id,
          name,
          unit,
          low_stock_threshold
        )
      `)
      .eq('user_id', user.id)
      .not('supplier_id', 'is', null)

    if (stockError) {
      console.error('Error fetching stocks:', stockError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des stocks' },
        { status: 500 }
      )
    }

    // Filtrer les produits en rupture de stock
    const lowStockItems = (stocks || []).filter((stock: any) => {
      const threshold = stock.product?.low_stock_threshold || 5
      return stock.quantity <= threshold
    })

    if (lowStockItems.length === 0) {
      return NextResponse.json({
        ordersCreated: 0,
        message: 'Aucun produit en rupture de stock',
      })
    }

    // Grouper par fournisseur
    const grouped = new Map<string, any[]>()
    lowStockItems.forEach((stock: any) => {
      if (!grouped.has(stock.supplier_id)) {
        grouped.set(stock.supplier_id, [])
      }
      grouped.get(stock.supplier_id)!.push(stock)
    })

    let ordersCreated = 0

    // Créer une commande pour chaque fournisseur
    for (const [supplierId, items] of grouped.entries()) {
      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          supplier_id: supplierId,
          status: 'pending',
          order_date: new Date().toISOString(),
          notes: `Commande automatique générée pour ${items.length} produit(s) en rupture de stock`,
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('Error creating order:', orderError)
        continue
      }

      // Créer les items de la commande
      const orderItems = items.map((stock: any) => {
        const threshold = stock.product.low_stock_threshold || 5
        const orderQuantity = Math.max(1, threshold * 2 - stock.quantity)

        return {
          order_id: order.id,
          product_id: stock.product_id,
          quantity: orderQuantity,
          unit: stock.product.unit,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Supprimer la commande si les items n'ont pas pu être créés
        await supabase.from('orders').delete().eq('id', order.id)
        continue
      }

      ordersCreated++
    }

    return NextResponse.json({
      ordersCreated,
      message: `${ordersCreated} commande(s) créée(s) avec succès`,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
