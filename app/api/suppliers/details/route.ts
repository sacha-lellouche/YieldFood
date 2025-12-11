import { NextRequest, NextResponse } from 'next/server'

// GET /api/suppliers/details?place_id=xxx - Récupère les détails complets d'un lieu
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('place_id')

    if (!placeId || placeId === 'manual') {
      return NextResponse.json({
        name: '',
        location: '',
        phone: '',
        opening_hours: '',
        specialties: '',
        website: '',
      })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY') {
      return NextResponse.json({
        name: '',
        location: '',
        phone: '',
        opening_hours: '',
        specialties: '',
        website: '',
      })
    }

    // Récupérer les détails du lieu
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,website,business_status,types,url&language=fr&key=${apiKey}`

    const detailsResponse = await fetch(detailsUrl)

    if (!detailsResponse.ok) {
      console.error('Google Places API error:', await detailsResponse.text())
      return NextResponse.json({
        name: '',
        location: '',
        phone: '',
        opening_hours: '',
        specialties: '',
        website: '',
      })
    }

    const detailsData = await detailsResponse.json()

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return NextResponse.json({
        name: '',
        location: '',
        phone: '',
        opening_hours: '',
        specialties: '',
        website: '',
      })
    }

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
        supermarket: 'Supermarché',
        bakery: 'Boulangerie',
        cafe: 'Café',
        bar: 'Bar',
        butcher: 'Boucherie',
        fish_market: 'Poissonnerie',
        fruit_and_vegetable_store: 'Fruits et légumes',
        organic_food_store: 'Produits bio',
        wine_store: 'Caviste',
        liquor_store: 'Caviste',
        meal_delivery: 'Livraison de repas',
        meal_takeaway: 'Plats à emporter',
        store: 'Magasin',
        convenience_store: 'Épicerie',
        health_food_store: 'Produits naturels',
      }

      const foundTypes = details.types
        .filter((type: string) => typeTranslations[type])
        .map((type: string) => typeTranslations[type])

      // Éviter les doublons
      specialties = [...new Set(foundTypes)].join(', ')
    }

    return NextResponse.json({
      name: details.name || '',
      location: details.formatted_address || '',
      phone: details.formatted_phone_number || details.international_phone_number || '',
      opening_hours: openingHours,
      specialties: specialties,
      website: details.website || '',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      name: '',
      location: '',
      phone: '',
      opening_hours: '',
      specialties: '',
      website: '',
    })
  }
}
