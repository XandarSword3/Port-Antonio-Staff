const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ifcjvulukaqoqnolgajb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY2p2dWx1a2Fxb3Fub2xnYWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5ODMsImV4cCI6MjA3MzA3MDk4M30.sRYxcMg9icEuymTro275_Kd1EDFFSaBvJUwgovJdu4k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCategories() {
  console.log('📋 Checking categories in database...')
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching categories:', error)
    return
  }
  
  console.log('✅ Categories found:', data.length)
  data.forEach(cat => {
    console.log(`  - ${cat.id}: ${cat.name}`)
  })
}

checkCategories()
