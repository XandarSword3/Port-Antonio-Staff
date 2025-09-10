const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ifcjvulukaqoqnolgajb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY2p2dWx1a2Fxb3Fub2xnYWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5ODMsImV4cCI6MjA3MzA3MDk4M30.sRYxcMg9icEuymTro275_Kd1EDFFSaBvJUwgovJdu4k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createOrderItemsTable() {
  console.log('🛠️ Creating order_items table...')
  
  try {
    // Create the table using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.order_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          dish_id TEXT NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (tableError) {
      console.log('⚠️ Cannot create table with anon key. Table needs to be created manually.')
      console.log('📋 Please run the SQL from create-order-items-table.sql in Supabase dashboard')
      return
    }
    
    console.log('✅ Table created successfully')
    
  } catch (error) {
    console.log('⚠️ Table creation requires admin privileges')
    console.log('📋 Please run the SQL from create-order-items-table.sql in Supabase dashboard')
    
    // Test if table exists by trying to query it
    const { data, error: queryError } = await supabase
      .from('order_items')
      .select('count')
      .limit(1)
      
    if (!queryError) {
      console.log('✅ order_items table already exists!')
    } else {
      console.log('❌ order_items table does not exist yet')
    }
  }
}

createOrderItemsTable()
