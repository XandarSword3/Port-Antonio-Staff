const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Use Vercel environment variables directly (these are the same values used in production)
const supabaseUrl = 'https://ifcjvulukaqoqnolgajb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY2p2dWx1a2Fxb3Fub2xnYWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5ODMsImV4cCI6MjA3MzA3MDk4M30.sRYxcMg9icEuymTro275_Kd1EDFFSaBvJUwgovJdu4k'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importFullMenu() {
  try {
    console.log('🍽️ Starting full menu import...')
    
    // Load dishes data from the parent directory
    const dishesPath = path.join(__dirname, '..', '..', 'data', 'dishes.json')
    console.log('📖 Loading dishes from:', dishesPath)
    
    if (!fs.existsSync(dishesPath)) {
      console.error('❌ dishes.json not found at:', dishesPath)
      return
    }
    
    const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf8'))
    console.log(`📊 Found ${dishesData.dishes.length} dishes to import`)
    
    // Clear existing dishes first
    console.log('🗑️ Clearing existing dishes...')
    const { error: deleteError } = await supabase
      .from('dishes')
      .delete()
      .neq('id', '')  // Delete all records
    
    if (deleteError) {
      console.log('⚠️ Note: Could not clear existing dishes:', deleteError.message)
    }
    
    // Category mapping to match our database
    const categoryMapping = {
      'beers': 'beers',
      'arak': 'arak', 
      'drinks': 'drinks',
      'platters': 'main-courses',
      'pizza': 'main-courses',
      'burgers': 'main-courses',
      'salads': 'appetizers',
      'sandwiches': 'main-courses',
      'starters': 'appetizers',
      'prosecco': 'drinks',
      'wine': 'drinks',
      'cocktails': 'drinks'
    }

    // Transform and import dishes
    const transformedDishes = dishesData.dishes.map(dish => {
      // Handle variants (multiple prices) by taking the first variant or the single price
      let price = 0
      if (dish.variants && dish.variants.length > 0) {
        price = dish.variants[0].price
      } else if (dish.price) {
        price = dish.price
      }
      
      // Map category to existing database categories
      const mappedCategoryId = categoryMapping[dish.categoryId] || 'appetizers'
      
      return {
        id: dish.id,
        name: dish.name,
        short_desc: dish.shortDesc || dish.name,
        full_desc: dish.fullDesc || dish.description || `Delicious ${dish.name} from our kitchen`,
        price: price,
        category_id: mappedCategoryId,
        available: dish.available !== false,
        image_url: dish.image || '/images/placeholder.jpg',
        currency: dish.currency || 'USD'
      }
    })
    
    console.log('📤 Uploading dishes to Supabase...')
    
    // Insert dishes in batches of 100 to avoid timeout
    const batchSize = 100
    for (let i = 0; i < transformedDishes.length; i += batchSize) {
      const batch = transformedDishes.slice(i, i + batchSize)
      console.log(`📦 Importing batch ${Math.floor(i/batchSize) + 1} (${batch.length} dishes)...`)
      
      const { data, error } = await supabase
        .from('dishes')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error)
        continue
      }
      
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} imported successfully`)
    }
    
    // Verify the import
    const { data: finalCount, error: countError } = await supabase
      .from('dishes')
      .select('id', { count: 'exact' })
    
    if (countError) {
      console.error('❌ Error counting dishes:', countError)
    } else {
      console.log(`🎉 Import complete! Total dishes in database: ${finalCount.length}`)
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error)
  }
}

// Run the import
importFullMenu()
