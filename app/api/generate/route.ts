import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Créer le client Supabase côté serveur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Vérifier l'authentification
    const cookieStore = await cookies()
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les données du body
    const body = await request.json()
    const { name, description, image_url } = body

    if (!name || !description) {
      return Response.json(
        { error: 'Nom et description requis' },
        { status: 400 }
      )
    }

    // Insérer le projet avec le user_id
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          name,
          description,
          image_url: image_url || null,
        },
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les projets de l'utilisateur
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data }, { status: 200 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
