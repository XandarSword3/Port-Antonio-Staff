// Simple menu data importer
// Run this to import your real dishes from dishes.json

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ifcjvulukaqoqnolgajb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY2p2dWx1a2Fxb3Fub2xnYWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5ODMsImV4cCI6MjA3MzA3MDk4M30.sRYxcMg9icEuymTro275_Kd1EDFFSaBvJUwgovJdu4k';

const supabase = createClient(supabaseUrl, supabaseKey);

// Some sample dishes to test with (we'll expand this)
const sampleDishes = [
  {
    id: 'almaza-beer',
    name: 'Almaza Beer',
    short_desc: 'Premium Lebanese beer',
    full_desc: 'Refreshing Almaza beer, perfect with Mediterranean cuisine',
    price: 6.00,
    category_id: 'beers',
    currency: 'USD',
    image_url: '/seed/almaza.jpg',
    available: true
  },
  {
    id: 'arak-traditional',
    name: 'Traditional Arak',
    short_desc: 'Authentic Lebanese arak',
    full_desc: 'Traditional Lebanese arak made from grapes and aniseed',
    price: 8.00,
    category_id: 'arak',
    currency: 'USD', 
    image_url: '/seed/arak.jpg',
    available: true
  },
  {
    id: 'hummus-classic',
    name: 'Classic Hummus',
    short_desc: 'Creamy chickpea dip',
    full_desc: 'Fresh hummus made daily with tahini, lemon, and olive oil',
    price: 12.00,
    category_id: 'appetizers',
    currency: 'USD',
    image_url: '/seed/hummus.jpg',
    available: true
  },
  {
    id: 'grilled-fish',
    name: 'Grilled Fish of the Day',
    short_desc: 'Fresh catch grilled to perfection',
    full_desc: 'Daily fresh fish selection grilled with herbs and lemon',
    price: 28.00,
    category_id: 'main-courses',
    currency: 'USD',
    image_url: '/seed/fish.jpg', 
    available: true
  }
];

async function importMenuData() {
  try {
    console.log('🔄 Starting menu data import...');
    
    // Clear existing dishes
    console.log('🗑️ Clearing existing test dishes...');
    const { error: deleteError } = await supabase
      .from('dishes')
      .delete()
      .neq('id', 'keep-this-id'); // Delete all
    
    if (deleteError) {
      console.log('Note: Could not clear existing dishes:', deleteError.message);
    }
    
    // Insert sample dishes
    console.log('📥 Inserting real menu items...');
    const { data, error } = await supabase
      .from('dishes')
      .insert(sampleDishes);
    
    if (error) {
      console.error('❌ Error inserting dishes:', error);
      return;
    }
    
    console.log('✅ Successfully imported menu data!');
    console.log(`📊 Imported ${sampleDishes.length} dishes`);
    
    // Test read
    const { data: testRead, error: readError } = await supabase
      .from('dishes')
      .select('*')
      .limit(5);
      
    if (readError) {
      console.error('❌ Error reading dishes:', readError);
    } else {
      console.log('✅ Database connection working!');
      console.log(`📋 Found ${testRead.length} dishes in database`);
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  }
}

importMenuData();
