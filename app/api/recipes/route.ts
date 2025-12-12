import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Fonction pour normaliser le nom d'un ingrédient
// (minuscule, trim, suppression des 's' finaux pour gérer le pluriel basique)
function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim()
  
  // Gérer les pluriels simples en 's' ou 'x'
  // Mais garder les mots qui se terminent naturellement par 's' (ex: frais, fois)
  if (normalized.endsWith('s') && normalized.length > 3 && !normalized.endsWith('ss')) {
    normalized = normalized.slice(0, -1)
  }
  
  return normalized
}

// Fonction pour catégoriser automatiquement un ingrédient
function categorizeIngredient(name: string): string {
  const nameLower = name.toLowerCase().trim()
  
  // Fruits & Légumes
  if (/tomate|carotte|oignon|poireau|salade|laitue|épinard|courgette|aubergine|poivron|concombre|radis|navet|céleri|fenouil|artichaut|asperge|brocoli|chou|champignon|pomme de terre|patate|courge|potiron|betterave|haricot vert|petit pois|pois|maïs|citron|orange|pomme|poire|banane|fraise|framboise|cerise|pêche|abricot|prune|raisin|melon|pastèque|kiwi|mangue|ananas|avocat|fig|datte|grenade/.test(nameLower)) {
    return 'Fruits & Légumes'
  }
  
  // Viandes & Volailles
  if (/bœuf|boeuf|veau|porc|agneau|mouton|poulet|dinde|canard|oie|pintade|lapin|gibier|steak|côte|entrecôte|filet|magret|cuisse|blanc|escalope|rôti|viande|volaille|rumsteak/.test(nameLower)) {
    return 'Viandes & Volailles'
  }
  
  // Poissons & Fruits de mer
  if (/poisson|saumon|thon|cabillaud|morue|truite|bar|dorade|sole|merlu|anchois|sardine|maquereau|crevette|gambas|homard|langouste|crabe|moule|huître|coquille|saint-jacques|calmar|poulpe|seiche|escargot/.test(nameLower)) {
    return 'Poissons & Fruits de mer'
  }
  
  // Produits laitiers
  if (/lait|crème|beurre|yaourt|yogourt|fromage|mozzarella|parmesan|emmental|comté|gruyère|chèvre|brie|camembert|roquefort|mascarpone|ricotta|feta/.test(nameLower)) {
    return 'Produits laitiers'
  }
  
  // Féculents & Pâtes
  if (/pâte|spaghetti|tagliatelle|ravioli|lasagne|riz|semoule|quinoa|boulgour|couscous|vermicelle|nouille/.test(nameLower)) {
    return 'Féculents & Pâtes'
  }
  
  // Boulangerie & Viennoiserie
  if (/pain|baguette|brioche|croissant|viennoiserie|toast|tartine|biscuit|cracker/.test(nameLower)) {
    return 'Boulangerie & Viennoiserie'
  }
  
  // Condiments & Sauces
  if (/sauce|ketchup|mayonnaise|moutarde|vinaigre|marinade|chutney|pesto|tapenade|cornichon|câpre|olive/.test(nameLower)) {
    return 'Condiments & Sauces'
  }
  
  // Huiles & Vinaigres
  if (/huile|vinaigre/.test(nameLower)) {
    return 'Huiles & Vinaigres'
  }
  
  // Épices & Herbes
  if (/épice|herbe|sel|poivre|paprika|cumin|curry|safran|cannelle|muscade|gingembre|ail|persil|basilic|thym|romarin|coriandre|menthe|aneth|estragon|laurier|origan/.test(nameLower)) {
    return 'Épices & Herbes'
  }
  
  // Boissons
  if (/eau|jus|soda|café|thé|vin|bière|alcool|liqueur|sirop/.test(nameLower)) {
    return 'Boissons'
  }
  
  // Épicerie salée / sucrée
  if (/farine|sucre|sel|levure|bicarbonate|chocolat|cacao|miel|confiture|gelée|sirop|vanille|œuf|oeuf/.test(nameLower)) {
    return 'Épicerie salée / sucrée'
  }
  
  // Surgelés
  if (/surgelé|congelé|glace/.test(nameLower)) {
    return 'Surgelés'
  }
  
  // Conserves
  if (/conserve|boîte|bocal/.test(nameLower)) {
    return 'Conserves'
  }
  
  // Par défaut
  return 'Autre'
}

// GET /api/recipes - Liste toutes les recettes
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    // Récupérer les recettes
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: recipes, error } = await query

    if (error) {
      console.error('Error fetching recipes:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des recettes' },
        { status: 500 }
      )
    }

    // Pour chaque recette, compter les ingrédients
    const recipesWithCount = await Promise.all(
      recipes.map(async (recipe) => {
        const { count } = await supabase
          .from('recipe_ingredients')
          .select('*', { count: 'exact', head: true })
          .eq('recipe_id', recipe.id)
        
        return {
          ...recipe,
          ingredient_count: count || 0,
        }
      })
    )

    return NextResponse.json(recipesWithCount)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/recipes - Crée une nouvelle recette avec ses ingrédients
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, servings, prep_time, cook_time, ingredients } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un ingrédient est requis' },
        { status: 400 }
      )
    }

    // 1. Créer la recette
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
          servings: servings || 1,
          prep_time: prep_time || null,
          cook_time: cook_time || null,
        },
      ])
      .select()
      .single()

    if (recipeError) {
      console.error('Error creating recipe:', recipeError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la recette' },
        { status: 500 }
      )
    }

    // 2. Créer les ingrédients de la recette
    const recipeIngredients = ingredients.map((ing: any) => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id || null,
      ingredient_name: ing.ingredient_name || ing.name,
      quantity: parseFloat(ing.quantity),
      unit: ing.unit,
    }))

    const { data: createdIngredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(recipeIngredients)
      .select()

    if (ingredientsError) {
      console.error('Error creating recipe ingredients:', ingredientsError)
      // Rollback: supprimer la recette
      await supabase.from('recipes').delete().eq('id', recipe.id)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout des ingrédients' },
        { status: 500 }
      )
    }

    // 3. Ajouter les ingrédients manquants dans les stocks avec quantité = 0
    try {
      console.log('Starting to add ingredients to stock...')
      
      // Récupérer tous les produits existants (partagés entre utilisateurs)
      const { data: existingProducts, error: productsError } = await supabase
        .from('product')
        .select('id, name, unit')

      if (productsError) {
        console.error('Error fetching products:', productsError)
      }

      console.log('Existing products:', existingProducts?.length || 0)

      // Récupérer tous les stocks existants de l'utilisateur
      const { data: existingStocks, error: stocksError } = await supabase
        .from('stock')
        .select('product_id')
        .eq('user_id', user.id)

      if (stocksError) {
        console.error('Error fetching stocks:', stocksError)
      }

      console.log('Existing stocks:', existingStocks?.length || 0)

      const stockedProductIds = new Set(
        existingStocks?.map((s) => s.product_id) || []
      )

      // Pour chaque ingrédient de la recette
      for (const ingredient of ingredients) {
        const ingredientName = (ingredient.ingredient_name || ingredient.name).trim()
        const normalizedIngredientName = normalizeIngredientName(ingredientName)

        console.log(`Processing ingredient: ${ingredientName} (normalized: ${normalizedIngredientName})`)

        // Trouver le produit existant en comparant les noms normalisés
        let productId = existingProducts?.find(
          (p) => normalizeIngredientName(p.name) === normalizedIngredientName
        )?.id

        if (!productId) {
          // Créer le produit s'il n'existe pas (produit partagé, pas de user_id)
          console.log(`Creating new product: ${ingredientName}`)
          
          // Déterminer la catégorie automatiquement
          const category = categorizeIngredient(ingredientName)
          
          const { data: newProduct, error: productError } = await supabase
            .from('product')
            .insert([
              {
                name: ingredientName,
                unit: ingredient.unit,
                category: category,
                low_stock_threshold: 5,
              },
            ])
            .select()
            .single()

          if (productError) {
            console.error('Error creating product:', productError)
          } else if (newProduct) {
            productId = newProduct.id
            console.log(`Product created with ID: ${productId}`)
          }
        } else {
          console.log(`Product already exists with ID: ${productId}`)
        }

        // Ajouter au stock si pas déjà présent
        if (productId && !stockedProductIds.has(productId)) {
          console.log(`Adding product ${productId} to stock with quantity 0`)
          const { error: stockError } = await supabase.from('stock').insert([
            {
              user_id: user.id,
              product_id: productId,
              quantity: 0,
            },
          ])

          if (stockError) {
            console.error('Error adding to stock:', stockError)
          } else {
            console.log(`Successfully added to stock`)
          }
        } else {
          console.log(`Product ${productId} already in stock, skipping`)
        }
      }

      console.log('Finished adding ingredients to stock')
    } catch (error) {
      console.error('Error adding ingredients to stock:', error)
      // Ne pas bloquer la création de la recette si l'ajout au stock échoue
    }

    return NextResponse.json(
      {
        ...recipe,
        ingredients: createdIngredients,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
