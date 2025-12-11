import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API est configurée
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY non configurée')
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans .env.local' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('menu') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const mimeType = file.type

    console.log('Analyse de la carte avec OpenAI GPT-4o...')

    // Analyser l'image avec OpenAI GPT-4o (très peu cher: ~0.01€ par analyse)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette carte de restaurant et extrait TOUS les plats avec leurs ingrédients DE BASE décomposés.

RÈGLE IMPORTANTE: Les ingrédients doivent être des PRODUITS BRUTS, pas des plats composés.

❌ MAUVAIS: "cheesecake", "gâteau", "pizza"
✅ BON: "fromage frais", "biscuits", "œufs", "sucre", "pâte à pizza", "sauce tomate", "mozzarella"

Pour chaque plat, fournis:
- name: Le nom exact du plat
- category: "Entrée", "Plat", "Dessert", ou "Cocktail"
- description: La description si disponible
- price: Le prix (nombre uniquement, sans symbole €)
- ingredients: Liste COMPLÈTE des ingrédients BRUTS nécessaires

Réponds UNIQUEMENT avec un JSON valide (sans backticks ni formatage markdown):
{
  "dishes": [
    {
      "name": "string",
      "category": "string",
      "description": "string",
      "price": number,
      "ingredients": ["string"]
    }
  ]
}

EXEMPLES DE DÉCOMPOSITION:
- Cheesecake → fromage frais, biscuits, beurre, œufs, sucre, crème
- Pizza Margherita → pâte à pizza, sauce tomate, mozzarella, basilic, huile d'olive
- Burger → pain burger, steak haché, salade, tomate, oignon, cornichons
- Tiramisu → mascarpone, biscuits à la cuillère, café, œufs, sucre, cacao
- Crème brûlée → crème liquide, jaunes d'œufs, sucre, vanille
- Salade César → laitue romaine, poulet, parmesan, croûtons, anchois, sauce césar`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const content = response.choices[0].message.content
    console.log('Réponse OpenAI:', content?.substring(0, 500))
    if (!content) {
      return NextResponse.json({ error: 'Aucune réponse de l\'IA' }, { status: 500 })
    }

    // Nettoyer le contenu (enlever les backticks si présents)
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parser le JSON
    let dishes
    try {
      dishes = JSON.parse(cleanContent)
    } catch (e) {
      console.error('Erreur parsing JSON:', cleanContent)
      return NextResponse.json({ error: 'Format de réponse invalide' }, { status: 500 })
    }

    return NextResponse.json(dishes)
  } catch (error: any) {
    console.error('Erreur analyse menu:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}
