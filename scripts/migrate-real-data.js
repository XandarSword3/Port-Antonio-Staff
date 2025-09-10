const fs = require('fs');
const path = require('path');

// Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ifcjvulukaqoqnolgajb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmY2p2dWx1a2Fxb3Fub2xnYWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5ODMsImV4cCI6MjA3MzA3MDk4M30.sRYxcMg9icEuymTro275_Kd1EDFFSaBvJUwgovJdu4k';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read real menu data from customer site
const dishesPath = path.join(__dirname, '..', '..', 'data', 'dishes.json');
const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf8'));

console.log(`🔄 Found ${dishesData.dishes.length} dishes to migrate...`);

async function migrateData() {
  try {
    // 1. Create database schema (run SQL directly)
    console.log('📋 Creating database tables...');
    
    // 2. Transform and insert real dishes
    console.log('🍽️ Migrating real menu data...');
    
    const transformedDishes = dishesData.dishes.map(dish => ({
      id: dish.id,
      name: dish.name,
      short_desc: dish.shortDesc || `Delicious ${dish.name}`,
      full_desc: dish.fullDesc || dish.shortDesc || `Fresh ${dish.name} prepared with care`,
      price: dish.price || (dish.variants && dish.variants[0]?.price) || 0,
      category_id: dish.categoryId,
      currency: dish.currency || 'USD',
      image_url: dish.image,
      available: dish.available !== false,
      created_at: new Date().toISOString()
    }));

    // Insert dishes in batches
    const batchSize = 50;
    for (let i = 0; i < transformedDishes.length; i += batchSize) {
      const batch = transformedDishes.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('dishes')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting batch ${i/batchSize + 1}:`, error);
      } else {
        console.log(`✅ Inserted batch ${i/batchSize + 1} (${batch.length} dishes)`);
      }
    }

    // 3. Create categories
    console.log('📂 Creating categories...');
    const categories = [
      { id: 'beers', name: 'Beers', order_index: 1 },
      { id: 'arak', name: 'Arak', order_index: 2 },
      { id: 'drinks', name: 'Drinks', order_index: 3 },
      { id: 'appetizers', name: 'Appetizers', order_index: 4 },
      { id: 'main-courses', name: 'Main Courses', order_index: 5 },
      { id: 'desserts', name: 'Desserts', order_index: 6 }
    ];

    const { error: catError } = await supabase
      .from('categories')
      .insert(categories);

    if (catError) {
      console.error('❌ Error creating categories:', catError);
    } else {
      console.log('✅ Categories created successfully');
    }

    // 4. Create admin user
    console.log('👤 Creating admin user...');
    const { error: userError } = await supabase
      .from('staff_users')
      .insert({
        email: 'admin@portsanantonio.com',
        username: 'admin',
        first_name: 'Port',
        last_name: 'Antonio Admin',
        role: 'owner',
        department: 'Management',
        is_active: true
      });

    if (userError) {
      console.error('❌ Error creating admin user:', userError);
    } else {
      console.log('✅ Admin user created successfully');
    }

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Total dishes migrated: ${dishesData.dishes.length}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

migrateData();
