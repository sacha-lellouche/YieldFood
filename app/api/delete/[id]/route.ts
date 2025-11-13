import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le projet pour vérifier le propriétaire et obtenir les images
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !project) {
      return Response.json(
        { error: 'Projet non trouvé ou accès non autorisé' },
        { status: 404 }
      )
    }

    // Supprimer les images du bucket si elles existent
    if (project.image_url) {
      // Extraire le chemin du fichier depuis l'URL
      const url = new URL(project.image_url)
      const pathParts = url.pathname.split('/')
      const bucketName = pathParts[pathParts.length - 2]
      const fileName = pathParts[pathParts.length - 1]

      if (bucketName && fileName) {
        await supabase.storage.from(bucketName).remove([fileName])
      }
    }

    // Supprimer le projet de la base de données
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 })
    }

    return Response.json({ message: 'Projet supprimé avec succès' }, { status: 200 })
  } catch (error: any) {
    console.error('Delete API error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
