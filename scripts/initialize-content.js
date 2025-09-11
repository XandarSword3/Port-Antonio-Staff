const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function initializeContent() {
  try {
    console.log('Initializing content...');

    // Initialize footer settings
    const { data: existingFooter } = await supabase
      .from('footer_settings')
      .select('id')
      .limit(1);

    if (!existingFooter || existingFooter.length === 0) {
      console.log('Creating default footer settings...');
      const { error: footerError } = await supabase
        .from('footer_settings')
        .insert([{
          company_name: 'Port San Antonio Resort & Restaurant',
          description: 'Experience luxury dining and hospitality at our premier resort destination.',
          address: '123 Resort Drive, San Antonio, TX 78201',
          phone: '(555) 123-4567',
          email: 'info@portsanantonio.com',
          dining_hours: 'Monday-Sunday: 6:00 AM - 10:00 PM',
          dining_location: 'Main Dining Room',
          social_links: {
            facebook: 'https://facebook.com/portsanantonio',
            instagram: 'https://instagram.com/portsanantonio',
            twitter: 'https://twitter.com/portsanantonio',
            linkedin: 'https://linkedin.com/company/portsanantonio'
          }
        }]);

      if (footerError) throw footerError;
      console.log('✓ Footer settings created');
    } else {
      console.log('✓ Footer settings already exist');
    }

    // Do not seed legal pages here; leave empty or populate via sync/legal or staff edits

    console.log('Content initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing content:', error);
    process.exit(1);
  }
}

initializeContent();
