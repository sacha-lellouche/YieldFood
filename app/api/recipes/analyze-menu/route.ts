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
- ingredients: Liste avec QUANTITÉS pour 1 PERSONNE
  * name: nom de l'ingrédient brut
  * quantity: quantité (nombre décimal)
  * unit: unité (kg, L, unité, g, ml)

Réponds UNIQUEMENT avec un JSON valide (sans backticks ni formatage markdown):
{
  "dishes": [
    {
      "name": "string",
      "category": "string",
      "description": "string",
      "price": number,
      "ingredients": [
        {
          "name": "string",
          "quantity": number,
          "unit": "string"
        }
      ]
    }
  ]
}

EXEMPLES DE DÉCOMPOSITION AVEC QUANTITÉS (pour 1 personne):
- Cheesecake → [{"name": "fromage frais", "quantity": 0.15, "unit": "kg"}, {"name": "biscuits", "quantity": 0.05, "unit": "kg"}, {"name": "beurre", "quantity": 0.03, "unit": "kg"}, {"name": "œufs", "quantity": 1, "unit": "unité"}, {"name": "sucre", "quantity": 0.04, "unit": "kg"}]
- Pizza Margherita → [{"name": "pâte à pizza", "quantity": 0.25, "unit": "kg"}, {"name": "sauce tomate", "quantity": 0.08, "unit": "kg"}, {"name": "mozzarella", "quantity": 0.12, "unit": "kg"}, {"name": "basilic", "quantity": 0.005, "unit": "kg"}]
- Burger → [{"name": "pain burger", "quantity": 1, "unit": "unité"}, {"name": "steak haché", "quantity": 0.15, "unit": "kg"}, {"name": "salade", "quantity": 0.03, "unit": "kg"}, {"name": "tomate", "quantity": 0.05, "unit": "kg"}]`
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
      max_tokens: 16000,
    })

    const content = response.choices[0].message.content
    console.log('Réponse OpenAI:', content?.substring(0, 500))
    if (!content) {
      console.error('OpenAI n\'a pas retourné de contenu')
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
      console.log('JSON parsé avec succès:', dishes?.dishes?.length, 'plats détectés')
    } catch (e) {
      console.error('Erreur parsing JSON:', e)
      console.error('Contenu reçu:', cleanContent)
      return NextResponse.json({ error: 'Format de réponse invalide de l\'IA' }, { status: 500 })
    }

    return NextResponse.json(dishes)
  } catch (error: any) {
    console.error('Erreur analyse menu:', error)
    console.error('Détails:', error.message, error.stack)
    return NextResponse.json(
      { error: `Erreur analyse: ${error.message || 'Erreur inconnue'}` },
      { status: 500 }
    )
  }
}
