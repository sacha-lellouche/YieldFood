import { NextRequest, NextResponse } from 'next/server'

// Base de données de commerces courants pour le fallback
const commonStores = [
  // Supermarchés
  { name: 'Carrefour', category: 'Supermarché', keywords: ['carref', 'carrefour'] },
  { name: 'Carrefour City', category: 'Supermarché', keywords: ['carref', 'city'] },
  { name: 'Carrefour Market', category: 'Supermarché', keywords: ['carref', 'market'] },
  { name: 'Carrefour Express', category: 'Supermarché', keywords: ['carref', 'express'] },
  { name: 'Monoprix', category: 'Supermarché', keywords: ['monop', 'monoprix'] },
  { name: 'Monop\'', category: 'Supermarché', keywords: ['monop'] },
  { name: 'Franprix', category: 'Supermarché', keywords: ['franprix', 'franc'] },
  { name: 'Naturalia', category: 'Bio', keywords: ['naturalia', 'natura'] },
  { name: 'Intermarché', category: 'Supermarché', keywords: ['inter', 'intermarche', 'intermarché'] },
  { name: 'Super U', category: 'Supermarché', keywords: ['super u', 'systeme u'] },
  { name: 'Hyper U', category: 'Hypermarché', keywords: ['hyper u', 'hyperu'] },
  { name: 'Auchan', category: 'Hypermarché', keywords: ['auchan'] },
  { name: 'Leclerc', category: 'Hypermarché', keywords: ['leclerc', 'leclere'] },
  { name: 'Casino', category: 'Supermarché', keywords: ['casino'] },
  { name: 'Géant Casino', category: 'Hypermarché', keywords: ['geant', 'géant'] },
  { name: 'Lidl', category: 'Discount', keywords: ['lidl'] },
  { name: 'Aldi', category: 'Discount', keywords: ['aldi'] },
  { name: 'Biocoop', category: 'Bio', keywords: ['biocoop', 'bio coop'] },
  { name: 'Picard', category: 'Surgelés', keywords: ['picard'] },
  { name: 'Grand Frais', category: 'Frais', keywords: ['grand frais', 'grand', 'frais'] },
  
  // Boulangeries
  { name: 'Boulangerie Artisanale', category: 'Boulangerie', keywords: ['boulang'] },
  { name: 'Paul', category: 'Boulangerie', keywords: ['paul'] },
  { name: 'La Mie Câline', category: 'Boulangerie', keywords: ['mie', 'caline', 'câline'] },
  
  // Boucheries
  { name: 'Boucherie Traditionnelle', category: 'Boucherie', keywords: ['boucherie', 'boucher'] },
  { name: 'Boucherie Halal', category: 'Boucherie', keywords: ['halal'] },
  
  // Marchés
  { name: 'Marché Bio', category: 'Marché', keywords: ['marché bio', 'marche bio'] },
  { name: 'Marché Local', category: 'Marché', keywords: ['marché', 'marche'] },
  
  // Poissonneries
  { name: 'Poissonnerie', category: 'Poissonnerie', keywords: ['poisson'] },
  
  // Primeurs
  { name: 'Primeur', category: 'Fruits et légumes', keywords: ['primeur', 'fruit', 'legume'] },
]

// GET /api/suppliers/autocomplete - Recherche plusieurs fournisseurs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || !query.trim() || query.trim().length < 2) {
      return NextResponse.json([])
    }

    const searchLower = query.trim().toLowerCase()
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    // Essayer d'abord avec Google Places API
    if (apiKey && apiKey !== 'YOUR_GOOGLE_PLACES_API_KEY') {
      try {
        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&types=establishment&language=fr&components=country:fr&key=${apiKey}`

        const autocompleteResponse = await fetch(autocompleteUrl)

        if (autocompleteResponse.ok) {
          const autocompleteData = await autocompleteResponse.json()

          if (autocompleteData.status === 'OK' && autocompleteData.predictions?.length > 0) {
            const suggestions = autocompleteData.predictions.slice(0, 5).map((prediction: any) => ({
              place_id: prediction.place_id,
              name: prediction.structured_formatting?.main_text || prediction.description,
              formatted_address:
                prediction.structured_formatting?.secondary_text || prediction.description,
              types: prediction.types || [],
              rating: null,
              user_ratings_total: null,
            }))

            return NextResponse.json(suggestions)
          }
        }
      } catch (error) {
        console.log('Google Places API unavailable, using local fallback')
      }
    }

    // Fallback : recherche dans la base locale
    const matches = commonStores
      .filter((store) => {
        const nameLower = store.name.toLowerCase()
        // Correspondance sur le nom ou les mots-clés
        return (
          nameLower.includes(searchLower) ||
          store.keywords.some((keyword) => keyword.includes(searchLower)) ||
          searchLower.split(' ').some((word) => store.keywords.some((kw) => kw.includes(word)))
        )
      })
      .slice(0, 5)
      .map((store, index) => ({
        place_id: `local_${index}_${store.name.replace(/\s/g, '_')}`,
        name: store.name,
        formatted_address: store.category,
        types: [store.category],
        rating: null,
        user_ratings_total: null,
      }))

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json([])
  }
}
