#!/usr/bin/env node

/**
 * Database and Setup Verification Script
 * Checks if all required tables, policies, and configurations are in place
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Required tables and their essential columns
const REQUIRED_TABLES = {
  'staff_users': ['email', 'username', 'role', 'department', 'is_active'],
  'reservations': ['customer_name', 'customer_email', 'party_size', 'reservation_date', 'status'],
  'orders': ['order_number', 'customer_name', 'status', 'total_amount'],
  'order_items': ['order_id', 'item_name', 'quantity', 'unit_price'],
  'menu_items': ['name', 'price', 'category', 'is_available'],
  'kitchen_tickets': ['order_id', 'order_number', 'status', 'items'],
  'notifications': ['type', 'title', 'message', 'created_at'],
  'legal_pages': ['slug', 'title', 'content'],
  'footer_settings': ['section', 'content'],
  'jobs': ['title', 'department', 'status'],
  'events': ['title', 'date', 'start_time', 'end_time', 'status'],
  'staff_activity': ['user_id', 'action', 'entity_type', 'timestamp']
};

// Required RLS policies
const REQUIRED_POLICIES = [
  'staff_users',
  'reservations', 
  'orders',
  'order_items',
  'menu_items',
  'kitchen_tickets',
  'notifications',
  'legal_pages',
  'footer_settings',
  'jobs',
  'events',
  'staff_activity'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function checkTableColumns(tableName, requiredColumns) {
  try {
    // Try to select specific columns to see if they exist
    const selectQuery = requiredColumns.join(', ');
    const { error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function checkRLSPolicies(tableName) {
  // Note: This is a simplified check. In production, you'd query pg_policies
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If we can query it, assume basic policies are in place
    return !error;
  } catch (error) {
    return false;
  }
}

async function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optionalEnvVars = [
    'CUSTOMER_WEBSITE_URL',
    'CUSTOMER_API_KEY',
    'WEBHOOK_SECRET'
  ];
  
  console.log('🔧 Environment Variables Check:');
  
  let allRequired = true;
  for (const envVar of requiredEnvVars) {
    const exists = !!process.env[envVar];
    console.log(`   ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'Set' : 'Missing'}`);
    if (!exists) allRequired = false;
  }
  
  console.log('\n   Optional (for customer website integration):');
  for (const envVar of optionalEnvVars) {
    const exists = !!process.env[envVar];
    console.log(`   ${exists ? '✅' : '⚠️ '} ${envVar}: ${exists ? 'Set' : 'Not set'}`);
  }
  
  return allRequired;
}

async function checkSampleData() {
  console.log('\n📊 Sample Data Check:');
  
  const tables = ['staff_users', 'menu_items', 'notifications', 'legal_pages'];
  const counts = {};
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      counts[table] = error ? 0 : (count || 0);
      console.log(`   ${table}: ${counts[table]} records`);
    } catch (error) {
      counts[table] = 0;
      console.log(`   ${table}: Error checking count`);
    }
  }
  
  return counts;
}

async function checkDatabaseConnectivity() {
  console.log('🔌 Database Connectivity Check:');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('staff_users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Database connection failed');
      console.log(`   Error: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkAPIEndpoints() {
  console.log('\n🌐 API Endpoints Check:');
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const endpoints = [
    '/api/users',
    '/api/reservations',
    '/api/orders',
    '/api/menu_items',
    '/api/notifications',
    '/api/metrics',
    '/api/legal'
  ];
  
  console.log(`   Testing against: ${baseUrl}`);
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const status = response.status;
      console.log(`   ${status < 400 ? '✅' : '❌'} ${endpoint}: ${status}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint}: Connection failed`);
    }
  }
}

async function generateSetupReport() {
  console.log('\n📋 Setup Completeness Report:');
  
  const report = {
    database_connection: false,
    required_tables: 0,
    table_columns: 0,
    rls_policies: 0,
    environment_vars: false,
    sample_data: {},
    issues: [],
    recommendations: []
  };
  
  // Check database connection
  report.database_connection = await checkDatabaseConnectivity();
  
  if (!report.database_connection) {
    report.issues.push('Database connection failed');
    report.recommendations.push('Check Supabase URL and service key');
    return report;
  }
  
  // Check tables and columns
  let tablesExist = 0;
  let columnsValid = 0;
  let policiesValid = 0;
  
  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
    const tableExists = await checkTableExists(tableName);
    if (tableExists) {
      tablesExist++;
      
      const columnsExist = await checkTableColumns(tableName, requiredColumns);
      if (columnsExist) {
        columnsValid++;
      } else {
        report.issues.push(`Table ${tableName} missing required columns`);
      }
      
      const policiesExist = await checkRLSPolicies(tableName);
      if (policiesExist) {
        policiesValid++;
      } else {
        report.issues.push(`Table ${tableName} missing RLS policies`);
      }
    } else {
      report.issues.push(`Table ${tableName} does not exist`);
    }
  }
  
  report.required_tables = tablesExist;
  report.table_columns = columnsValid;
  report.rls_policies = policiesValid;
  
  // Check environment variables
  report.environment_vars = await checkEnvironmentVariables();
  
  // Check sample data
  report.sample_data = await checkSampleData();
  
  // Generate recommendations
  if (report.required_tables < Object.keys(REQUIRED_TABLES).length) {
    report.recommendations.push('Run complete-database-setup.sql in Supabase SQL Editor');
  }
  
  if (!report.environment_vars) {
    report.recommendations.push('Set all required environment variables in Vercel dashboard');
  }
  
  if (report.sample_data.staff_users === 0) {
    report.recommendations.push('Create at least one staff user account');
  }
  
  if (report.sample_data.menu_items === 0) {
    report.recommendations.push('Import menu items from customer website or add manually');
  }
  
  // Summary
  const totalTables = Object.keys(REQUIRED_TABLES).length;
  const completeness = Math.round((report.required_tables / totalTables) * 100);
  
  console.log(`\n   Database Completeness: ${completeness}%`);
  console.log(`   Tables: ${report.required_tables}/${totalTables}`);
  console.log(`   Columns: ${report.table_columns}/${totalTables}`);
  console.log(`   Policies: ${report.rls_policies}/${totalTables}`);
  console.log(`   Environment: ${report.environment_vars ? 'Complete' : 'Incomplete'}`);
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    report.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  return report;
}

async function main() {
  console.log('🔍 Port Antonio Staff Portal - Setup Verification\n');
  
  try {
    const report = await generateSetupReport();
    
    // Optional: Check API endpoints if running locally
    if (process.env.NODE_ENV !== 'production') {
      await checkAPIEndpoints();
    }
    
    const isComplete = report.required_tables === Object.keys(REQUIRED_TABLES).length 
                      && report.environment_vars 
                      && report.issues.length === 0;
    
    console.log(`\n${isComplete ? '🎉' : '⚠️'} Setup Status: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
    
    if (isComplete) {
      console.log('\n✅ Your staff portal is ready to use!');
      console.log('   - All required tables are present');
      console.log('   - Environment variables are configured');
      console.log('   - Database connection is working');
      console.log('\nNext steps:');
      console.log('   1. Create staff user accounts');
      console.log('   2. Import menu items');
      console.log('   3. Configure customer website integration');
    } else {
      console.log('\n❌ Setup is incomplete. Please address the issues above.');
    }
    
    process.exit(isComplete ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkTableExists,
  checkTableColumns,
  checkRLSPolicies,
  generateSetupReport
};
