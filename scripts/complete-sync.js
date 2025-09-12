#!/usr/bin/env node

/**
 * Complete Data Synchronization Script
 * Syncs menu items and legal pages from customer website to staff portal database
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const CUSTOMER_WEBSITE_URL = process.env.CUSTOMER_WEBSITE_URL || 'https://port-antonio.com';
const CUSTOMER_API_KEY = process.env.CUSTOMER_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CUSTOMER_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- CUSTOMER_API_KEY');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncMenu() {
  console.log('🍽️  Syncing menu data...');
  
  try {
    // Fetch menu from customer website
    const response = await fetch(`${CUSTOMER_WEBSITE_URL}/api/menu`, {
      headers: {
        'X-API-Key': CUSTOMER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`);
    }

    const menuData = await response.json();
    let totalItems = 0;
    let updatedItems = 0;

    // Process categories and items
    for (const category of menuData.categories || []) {
      console.log(`   Processing category: ${category.name}`);
      
      // Ensure category exists
      const { data: existingCategory, error: categoryError } = await supabase
        .from('menu_items')
        .select('category')
        .eq('category', category.slug)
        .limit(1);

      if (categoryError) {
        console.error(`   Error checking category: ${categoryError.message}`);
        continue;
      }

      // Process items in this category
      for (const item of category.items || []) {
        totalItems++;
        
        const menuItem = {
          name: item.name,
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          currency: item.currency || 'USD',
          category: category.slug,
          image: item.image || null,
          allergens: item.allergens || [],
          dietary_restrictions: item.dietary || [],
          is_available: item.availability !== false,
          external_id: item.id,
        };

        // Upsert menu item
        const { data, error } = await supabase
          .from('menu_items')
          .upsert(menuItem, { 
            onConflict: 'external_id',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error(`   Error upserting item ${item.name}: ${error.message}`);
        } else {
          updatedItems++;
          console.log(`   ✓ ${item.name}`);
        }
      }
    }

    console.log(`✅ Menu sync completed: ${updatedItems}/${totalItems} items updated`);
    return { success: true, totalItems, updatedItems };

  } catch (error) {
    console.error(`❌ Menu sync failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function syncLegalPages() {
  console.log('📄 Syncing legal pages...');
  
  try {
    // Fetch legal pages from customer website
    const response = await fetch(`${CUSTOMER_WEBSITE_URL}/api/legal`, {
      headers: {
        'X-API-Key': CUSTOMER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch legal pages: ${response.status} ${response.statusText}`);
    }

    const legalData = await response.json();
    let totalPages = 0;
    let updatedPages = 0;

    // Process each legal page
    for (const page of legalData.pages || []) {
      totalPages++;
      console.log(`   Processing: ${page.title}`);
      
      const legalPage = {
        slug: page.slug,
        title: page.title,
        content: page.content,
        last_updated: page.last_updated ? new Date(page.last_updated) : new Date(),
      };

      // Upsert legal page
      const { data, error } = await supabase
        .from('legal_pages')
        .upsert(legalPage, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`   Error upserting page ${page.title}: ${error.message}`);
      } else {
        updatedPages++;
        console.log(`   ✓ ${page.title}`);
      }
    }

    console.log(`✅ Legal pages sync completed: ${updatedPages}/${totalPages} pages updated`);
    return { success: true, totalPages, updatedPages };

  } catch (error) {
    console.error(`❌ Legal pages sync failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createSyncReport() {
  const timestamp = new Date().toISOString();
  
  console.log('\n📊 Creating sync report...');
  
  // Get current counts
  const { count: menuCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true });
    
  const { count: legalCount } = await supabase
    .from('legal_pages')
    .select('*', { count: 'exact', head: true });
    
  const { count: reservationCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true });
    
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const report = {
    sync_timestamp: timestamp,
    menu_items_count: menuCount || 0,
    legal_pages_count: legalCount || 0,
    reservations_count: reservationCount || 0,
    orders_count: orderCount || 0,
    last_sync_source: 'customer_website',
  };

  console.log('\n📈 Current Database Status:');
  console.log(`   Menu Items: ${report.menu_items_count}`);
  console.log(`   Legal Pages: ${report.legal_pages_count}`);
  console.log(`   Reservations: ${report.reservations_count}`);
  console.log(`   Orders: ${report.orders_count}`);
  
  return report;
}

async function main() {
  console.log('🚀 Starting complete data synchronization...\n');
  
  const startTime = Date.now();
  
  // Run synchronization tasks
  const menuResult = await syncMenu();
  const legalResult = await syncLegalPages();
  
  // Generate report
  const report = await createSyncReport();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️  Total sync time: ${duration} seconds`);
  
  // Summary
  if (menuResult.success && legalResult.success) {
    console.log('\n🎉 All synchronization tasks completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some synchronization tasks failed.');
    if (!menuResult.success) console.log(`   Menu sync error: ${menuResult.error}`);
    if (!legalResult.success) console.log(`   Legal pages sync error: ${legalResult.error}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Sync script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  syncMenu,
  syncLegalPages,
  createSyncReport,
};
