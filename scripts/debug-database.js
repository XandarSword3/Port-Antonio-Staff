const { createClient } = require('@supabase/supabase-js');

async function debugDatabase() {
  // Use the same environment variables as the API routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Environment check:');
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing environment variables. Please check your .env.local file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Debugging Database Tables and Data...\n');

  // Check if reservations table exists and has data
  console.log('--- RESERVATIONS TABLE ---');
  try {
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(5);
    
    if (reservationsError) {
      console.log('❌ Reservations error:', reservationsError);
    } else {
      console.log('✅ Reservations table exists');
      console.log('📊 Sample data:', reservations?.length || 0, 'records');
      if (reservations?.length > 0) {
        console.log('🔍 First record:', JSON.stringify(reservations[0], null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Reservations table error:', error.message);
  }

  // Check analytics_events table
  console.log('\n--- ANALYTICS_EVENTS TABLE ---');
  try {
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(5);
    
    if (eventsError) {
      console.log('❌ Analytics events error:', eventsError);
    } else {
      console.log('✅ Analytics_events table exists');
      console.log('📊 Sample data:', events?.length || 0, 'records');
      if (events?.length > 0) {
        console.log('🔍 First record:', JSON.stringify(events[0], null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Analytics_events table error:', error.message);
  }

  // Check visitors table
  console.log('\n--- VISITORS TABLE ---');
  try {
    const { data: visitors, error: visitorsError } = await supabase
      .from('visitors')
      .select('*')
      .limit(5);
    
    if (visitorsError) {
      console.log('❌ Visitors error:', visitorsError);
    } else {
      console.log('✅ Visitors table exists');
      console.log('📊 Sample data:', visitors?.length || 0, 'records');
      if (visitors?.length > 0) {
        console.log('🔍 First record:', JSON.stringify(visitors[0], null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Visitors table error:', error.message);
  }

  // Check user_visitors table
  console.log('\n--- USER_VISITORS TABLE ---');
  try {
    const { data: userVisitors, error: userVisitorsError } = await supabase
      .from('user_visitors')
      .select('*')
      .limit(5);
    
    if (userVisitorsError) {
      console.log('❌ User_visitors error:', userVisitorsError);
    } else {
      console.log('✅ User_visitors table exists');
      console.log('📊 Sample data:', userVisitors?.length || 0, 'records');
      if (userVisitors?.length > 0) {
        console.log('🔍 First record:', JSON.stringify(userVisitors[0], null, 2));
      }
    }
  } catch (error) {
    console.log('❌ User_visitors table error:', error.message);
  }

  // Check staff_users table
  console.log('\n--- STAFF_USERS TABLE ---');
  try {
    const { data: staff, error: staffError } = await supabase
      .from('staff_users')
      .select('*')
      .limit(5);
    
    if (staffError) {
      console.log('❌ Staff_users error:', staffError);
    } else {
      console.log('✅ Staff_users table exists');
      console.log('📊 Sample data:', staff?.length || 0, 'records');
      if (staff?.length > 0) {
        console.log('🔍 First record:', JSON.stringify(staff[0], null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Staff_users table error:', error.message);
  }

  // Check notifications table
  console.log('\n--- NOTIFICATIONS TABLE ---');
  try {
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (notificationsError) {
      console.log('❌ Notifications error:', notificationsError);
    } else {
      console.log('✅ Notifications table exists');
      console.log('📊 Sample data:', notifications?.length || 0, 'records');
    }
  } catch (error) {
    console.log('❌ Notifications table error:', error.message);
  }

  console.log('\n🏁 Database debug complete!');
}

debugDatabase().catch(console.error);
