import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Initialize footer settings
    const { data: existingFooter } = await supabaseAdmin
      .from('footer_settings')
      .select('id')
      .limit(1);

    if (!existingFooter || existingFooter.length === 0) {
      const { error: footerError } = await supabaseAdmin
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
    }

    // Initialize legal pages
    const legalPages = [
      {
        type: 'privacy',
        title: 'Privacy Policy',
        sections: [
          {
            id: '1',
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us, such as when you make a reservation, place an order, or contact us for support.',
            order: 1
          },
          {
            id: '2',
            title: 'How We Use Your Information',
            content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.',
            order: 2
          },
          {
            id: '3',
            title: 'Information Sharing',
            content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.',
            order: 3
          }
        ]
      },
      {
        type: 'terms',
        title: 'Terms of Service',
        sections: [
          {
            id: '1',
            title: 'Acceptance of Terms',
            content: 'By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.',
            order: 1
          },
          {
            id: '2',
            title: 'Use License',
            content: 'Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.',
            order: 2
          },
          {
            id: '3',
            title: 'Disclaimer',
            content: 'The materials on our website are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties.',
            order: 3
          }
        ]
      },
      {
        type: 'accessibility',
        title: 'Accessibility Statement',
        sections: [
          {
            id: '1',
            title: 'Our Commitment',
            content: 'We are committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.',
            order: 1
          },
          {
            id: '2',
            title: 'Accessibility Features',
            content: 'Our website includes features such as keyboard navigation, screen reader compatibility, and high contrast options.',
            order: 2
          },
          {
            id: '3',
            title: 'Feedback',
            content: 'If you encounter any accessibility barriers, please contact us at accessibility@portsanantonio.com',
            order: 3
          }
        ]
      }
    ];

    for (const page of legalPages) {
      const { data: existingPage } = await supabaseAdmin
        .from('legal_pages')
        .select('id')
        .eq('type', page.type)
        .limit(1);

      if (!existingPage || existingPage.length === 0) {
        const { error: pageError } = await supabaseAdmin
          .from('legal_pages')
          .insert([page]);

        if (pageError) throw pageError;
      }
    }

    return NextResponse.json({ success: true, message: 'Content initialized successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to initialize content' }, { status: 500 })
  }
}
