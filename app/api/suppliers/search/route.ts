import { NextRequest, NextResponse } from 'next/server'

// GET /api/suppliers/search - Recherche un fournisseur sur Internet
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY') {
      // Fallback: utiliser Groq pour générer des suggestions basées sur le nom
      return await generateSupplierWithAI(query.trim())
    }

    // Recherche avec Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      query
    )}&inputtype=textquery&fields=name,formatted_address,formatted_phone_number,opening_hours,website,business_status,types&key=${apiKey}`

    const placesResponse = await fetch(placesUrl)

    if (!placesResponse.ok) {
      console.error('Google Places API error:', await placesResponse.text())
      return await generateSupplierWithAI(query.trim())
    }

    const placesData = await placesResponse.json()

    if (
      !placesData.candidates ||
      placesData.candidates.length === 0 ||
      placesData.status === 'ZERO_RESULTS'
    ) {
      // Fallback vers IA si aucun résultat
      return await generateSupplierWithAI(query.trim())
    }

    const place = placesData.candidates[0]

    // Si on a un place_id, récupérer plus de détails
    if (place.place_id) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,website,business_status,types,url&key=${apiKey}`

      const detailsResponse = await fetch(detailsUrl)

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        const details = detailsData.result

        // Formater les horaires
        let openingHours = ''
        if (details.opening_hours && details.opening_hours.weekday_text) {
          openingHours = details.opening_hours.weekday_text.join('\n')
        }

        // Déterminer les spécialités basées sur les types
        let specialties = ''
        if (details.types && Array.isArray(details.types)) {
          const typeTranslations: Record<string, string> = {
            restaurant: 'Restaurant',
            food: 'Alimentation',
            grocery_or_supermarket: 'Supermarché',
            bakery: 'Boulangerie',
            cafe: 'Café',
            butcher: 'Boucherie',
            fish_market: 'Poissonnerie',
            fruit_and_vegetable_store: 'Fruits et légumes',
            organic_food_store: 'Produits bio',
            wine_store: 'Caviste',
          }

          specialties = details.types
            .filter((type: string) => typeTranslations[type])
            .map((type: string) => typeTranslations[type])
            .join(', ')
        }

        return NextResponse.json({
          name: details.name || '',
          location: details.formatted_address || '',
          phone: details.formatted_phone_number || details.international_phone_number || '',
          opening_hours: openingHours,
          specialties: specialties,
          website: details.website || '',
        })
      }
    }

    // Fallback avec les données basiques
    return NextResponse.json({
      name: place.name || '',
      location: place.formatted_address || '',
      phone: place.formatted_phone_number || '',
      opening_hours: place.opening_hours
        ? place.opening_hours.weekday_text?.join('\n') || ''
        : '',
      specialties: '',
      website: place.website || '',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Fonction de fallback utilisant Groq pour générer des suggestions
async function generateSupplierWithAI(query: string) {
  const groqApiKey = process.env.GROQ_API_KEY

  if (!groqApiKey) {
    return NextResponse.json({
      name: query,
      location: '',
      phone: '',
      opening_hours: '',
      specialties: '',
      website: '',
    })
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant qui aide à remplir les informations sur les fournisseurs. Réponds UNIQUEMENT avec un JSON valide contenant "specialties" (string, types de produits probables pour ce fournisseur), "opening_hours" (string, horaires typiques au format "Lun-Ven: 8h-19h\\nSam: 8h-13h\\nDim: Fermé"). Pas de texte avant ou après le JSON.',
          },
          {
            role: 'user',
            content: `Nom du fournisseur: "${query}". Donne des suggestions de spécialités probables et horaires typiques.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (groqResponse.ok) {
      const data = await groqResponse.json()
      const content = data.choices[0]?.message?.content

      try {
        let jsonContent = content.trim()
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        const firstBrace = jsonContent.indexOf('{')
        const lastBrace = jsonContent.lastIndexOf('}')

        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonContent = jsonContent.substring(firstBrace, lastBrace + 1)
        }

        const parsed = JSON.parse(jsonContent)

        return NextResponse.json({
          name: query,
          location: '',
          phone: '',
          opening_hours: parsed.opening_hours || '',
          specialties: parsed.specialties || '',
          website: '',
        })
      } catch (e) {
        console.error('Failed to parse AI response:', content)
      }
    }
  } catch (error) {
    console.error('AI generation error:', error)
  }

  // Fallback final
  return NextResponse.json({
    name: query,
    location: '',
    phone: '',
    opening_hours: '',
    specialties: '',
    website: '',
  })
}
