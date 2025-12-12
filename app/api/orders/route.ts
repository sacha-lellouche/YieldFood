import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/orders
 * Récupère l'historique des commandes de l'utilisateur
 */
export async function GET(request: NextRequest) {
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

    // Récupérer toutes les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_date,
        status,
        created_at
      `)
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      )
    }

    // Pour chaque commande, récupérer les items avec les infos du fournisseur
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order: any) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            product_name,
            quantity_ordered,
            unit,
            created_at
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          return { ...order, items: [], supplier: null }
        }

        // Récupérer le fournisseur depuis le premier produit de la commande
        let supplier = null
        if (items && items.length > 0) {
          const { data: stockData } = await supabase
            .from('stock')
            .select(`
              supplier_id,
              suppliers:supplier_id (
                id,
                name,
                email,
                phone
              )
            `)
            .eq('product_id', items[0].product_id)
            .eq('user_id', user.id)
            .single()

          if (stockData?.suppliers) {
            supplier = stockData.suppliers
          }
        }

        // Transformer les items pour correspondre au format attendu
        const transformedItems = (items || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity_ordered,
          unit: item.unit,
          created_at: item.created_at,
          product: {
            id: item.product_id,
            name: item.product_name
          }
        }))

        return {
          ...order,
          items: transformedItems,
          supplier
        }
      })
    )

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
