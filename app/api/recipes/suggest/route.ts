import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// POST /api/recipes/suggest - Suggère des ingrédients pour une recette via IA
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
    const { recipeName, description, servings } = body

    if (!recipeName || !recipeName.trim()) {
      return NextResponse.json(
        { error: 'Le nom de la recette est requis' },
        { status: 400 }
      )
    }

    // Utiliser Groq (gratuit et rapide) avec Llama
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not configured')
      // Fallback to mock if no API key
      const mockSuggestions = getMockIngredients(recipeName.toLowerCase(), servings || 4)
      return NextResponse.json({ ingredients: mockSuggestions })
    }
    
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Tu es un chef cuisinier expert français. Tu dois suggérer une liste d\'ingrédients pour une recette française. Réponds UNIQUEMENT avec un JSON valide contenant un tableau "ingredients" avec des objets ayant "name" (string, nom en français), "quantity" (number, quantité réaliste), et "unit" (string parmi: g, kg, ml, l, pièce, c. à soupe, c. à café). Aucun texte avant ou après le JSON.',
            },
            {
              role: 'user',
              content: `Recette: "${recipeName}"${description ? `. Description: ${description}` : ''}${servings ? ` pour ${servings} personne(s)` : ' pour 4 personnes'}. Donne les ingrédients avec quantités réalistes.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      if (groqResponse.ok) {
        const data = await groqResponse.json()
        const content = data.choices[0]?.message?.content
        
        try {
          // Nettoyer le contenu pour extraire uniquement le JSON
          let jsonContent = content.trim()
          
          // Supprimer les balises markdown si présentes
          jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
          
          // Trouver le premier { et le dernier }
          const firstBrace = jsonContent.indexOf('{')
          const lastBrace = jsonContent.lastIndexOf('}')
          
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonContent = jsonContent.substring(firstBrace, lastBrace + 1)
          }
          
          const parsed = JSON.parse(jsonContent)
          
          if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
            // Valider et nettoyer les ingrédients
            const validIngredients = parsed.ingredients
              .filter((ing: any) => ing.name && ing.quantity && ing.unit)
              .map((ing: any) => ({
                name: String(ing.name).trim(),
                quantity: parseFloat(ing.quantity) || 0,
                unit: String(ing.unit).toLowerCase()
              }))
            
            if (validIngredients.length > 0) {
              return NextResponse.json({ ingredients: validIngredients })
            }
          }
        } catch (e) {
          console.error('Failed to parse Groq response:', content)
        }
      } else {
        console.error('Groq API error:', await groqResponse.text())
      }
    } catch (error) {
      console.error('Groq API error:', error)
    }

    // Fallback: Mock intelligent basé sur le nom de la recette
    const mockSuggestions = getMockIngredients(recipeName.toLowerCase(), servings || 4)
    
    return NextResponse.json({ ingredients: mockSuggestions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Fonction de fallback : suggestions mockées intelligentes
function getMockIngredients(recipeName: string, servings: number) {
  const baseMultiplier = servings / 4 // Base pour 4 personnes

  // Base de données de recettes communes
  const recipes: Record<string, any[]> = {
    'pâtes carbonara': [
      { name: 'Pâtes', quantity: 400 * baseMultiplier, unit: 'g' },
      { name: 'Lardons', quantity: 200 * baseMultiplier, unit: 'g' },
      { name: 'Œufs', quantity: 4 * baseMultiplier, unit: 'pièce' },
      { name: 'Parmesan', quantity: 100 * baseMultiplier, unit: 'g' },
      { name: 'Crème fraîche', quantity: 200 * baseMultiplier, unit: 'mL' },
      { name: 'Poivre', quantity: 1, unit: 'c. à café' },
    ],
    'pizza margherita': [
      { name: 'Pâte à pizza', quantity: 1 * baseMultiplier, unit: 'pièce' },
      { name: 'Sauce tomate', quantity: 200 * baseMultiplier, unit: 'mL' },
      { name: 'Mozzarella', quantity: 250 * baseMultiplier, unit: 'g' },
      { name: 'Basilic frais', quantity: 10 * baseMultiplier, unit: 'pièce' },
      { name: 'Huile d\'olive', quantity: 2, unit: 'c. à soupe' },
      { name: 'Sel', quantity: 1, unit: 'c. à café' },
    ],
    'salade césar': [
      { name: 'Laitue romaine', quantity: 1 * baseMultiplier, unit: 'pièce' },
      { name: 'Poulet grillé', quantity: 300 * baseMultiplier, unit: 'g' },
      { name: 'Parmesan', quantity: 50 * baseMultiplier, unit: 'g' },
      { name: 'Croûtons', quantity: 100 * baseMultiplier, unit: 'g' },
      { name: 'Sauce César', quantity: 100 * baseMultiplier, unit: 'mL' },
    ],
    'omelette': [
      { name: 'Œufs', quantity: 3 * baseMultiplier, unit: 'pièce' },
      { name: 'Lait', quantity: 50 * baseMultiplier, unit: 'mL' },
      { name: 'Beurre', quantity: 20 * baseMultiplier, unit: 'g' },
      { name: 'Sel', quantity: 1, unit: 'pincée' },
      { name: 'Poivre', quantity: 1, unit: 'pincée' },
    ],
  }

  // Chercher une correspondance partielle
  for (const [key, ingredients] of Object.entries(recipes)) {
    if (recipeName.includes(key) || key.includes(recipeName)) {
      return ingredients
    }
  }

  // Suggestions génériques par mots-clés
  if (recipeName.includes('pâtes') || recipeName.includes('pasta')) {
    return [
      { name: 'Pâtes', quantity: 400 * baseMultiplier, unit: 'g' },
      { name: 'Huile d\'olive', quantity: 2, unit: 'c. à soupe' },
      { name: 'Sel', quantity: 1, unit: 'c. à café' },
    ]
  }

  if (recipeName.includes('poulet') || recipeName.includes('chicken')) {
    return [
      { name: 'Poulet', quantity: 600 * baseMultiplier, unit: 'g' },
      { name: 'Huile', quantity: 2, unit: 'c. à soupe' },
      { name: 'Sel', quantity: 1, unit: 'c. à café' },
      { name: 'Poivre', quantity: 1, unit: 'c. à café' },
    ]
  }

  if (recipeName.includes('gâteau') || recipeName.includes('cake')) {
    return [
      { name: 'Farine', quantity: 250 * baseMultiplier, unit: 'g' },
      { name: 'Sucre', quantity: 200 * baseMultiplier, unit: 'g' },
      { name: 'Œufs', quantity: 3 * baseMultiplier, unit: 'pièce' },
      { name: 'Beurre', quantity: 125 * baseMultiplier, unit: 'g' },
      { name: 'Levure', quantity: 10, unit: 'g' },
    ]
  }

  // Suggestion par défaut très générique
  return [
    { name: 'Ingrédient principal', quantity: 500 * baseMultiplier, unit: 'g' },
    { name: 'Huile', quantity: 2, unit: 'c. à soupe' },
    { name: 'Sel', quantity: 1, unit: 'c. à café' },
    { name: 'Poivre', quantity: 1, unit: 'c. à café' },
  ]
}
