/**
 * Script pour mettre tous les stocks à un niveau "ok"
 * Usage: node supabase/fill-stocks.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fillAllStocks() {
  console.log('🚀 Démarrage du remplissage des stocks...\n')

  try {
    // Récupérer tous les stocks avec les infos des produits
    const { data: stocks, error: fetchError } = await supabase
      .from('stock')
      .select(`
        id,
        quantity,
        user_id,
        product_id,
        product:product_id (
          id,
          name,
          unit,
          low_stock_threshold
        )
      `)

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des stocks:', fetchError)
      return
    }

    console.log(`📦 ${stocks.length} stocks trouvés\n`)

    let updatedCount = 0
    let okCount = 0

    for (const stock of stocks) {
      const threshold = stock.product.low_stock_threshold || 10
      const currentQty = stock.quantity || 0
      let newQuantity = currentQty

      if (currentQty === 0) {
        newQuantity = 50
        console.log(`🔴 ${stock.product.name}: 0 → 50 ${stock.product.unit} (RUPTURE)`)
      } else if (currentQty < threshold) {
        newQuantity = threshold + 10
        console.log(`🟠 ${stock.product.name}: ${currentQty} → ${newQuantity} ${stock.product.unit} (BAS)`)
      } else {
        okCount++
        continue
      }

      // Mettre à jour le stock
      const { error: updateError } = await supabase
        .from('stock')
        .update({ quantity: newQuantity })
        .eq('id', stock.id)

      if (updateError) {
        console.error(`❌ Erreur mise à jour ${stock.product.name}:`, updateError)
      } else {
        updatedCount++
      }
    }

    console.log('\n✅ Remplissage terminé!')
    console.log(`📊 Résumé:`)
    console.log(`   - ${updatedCount} stocks mis à jour`)
    console.log(`   - ${okCount} stocks déjà ok`)
    console.log(`   - ${stocks.length} stocks au total`)

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

fillAllStocks()
