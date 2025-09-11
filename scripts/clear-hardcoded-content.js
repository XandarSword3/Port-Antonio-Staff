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

async function clearHardcodedContent() {
  try {
    console.log('Clearing hardcoded content from database...');

    // Clear all legal pages
    const { error: legalError } = await supabase
      .from('legal_pages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (legalError) throw legalError;
    console.log('✓ Cleared legal_pages table');

    // Clear footer settings
    const { error: footerError } = await supabase
      .from('footer_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (footerError) throw footerError;
    console.log('✓ Cleared footer_settings table');

    console.log('✅ All hardcoded content cleared from database!');
    console.log('The staff portal will now load content from the customer website database.');
  } catch (error) {
    console.error('Error clearing content:', error);
    process.exit(1);
  }
}

clearHardcodedContent();
