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
          company_name: 'Port Antonio Resort',
          description: 'Luxury beachfront resort with world-class dining',
          address: 'Port Antonio, Mastita, Lebanon',
          phone: '+1 (876) 555-0123',
          email: 'info@portantonio.com',
          dining_hours: 'Dining Available 24/7',
          dining_location: 'Main Restaurant & Beachside',
          social_links: {
            facebook: 'https://facebook.com/portantonio',
            instagram: 'https://instagram.com/portantonio',
            twitter: 'https://twitter.com/portantonio',
            linkedin: 'https://linkedin.com/company/portantonio'
          }
        }]);

      if (footerError) throw footerError;
    }

    // Seed legal pages only if table is empty (editable defaults)
    const { data: anyLegal } = await supabaseAdmin
      .from('legal_pages')
      .select('id')
      .limit(1);

    if (!anyLegal || anyLegal.length === 0) {
      const legalPages = [
        {
          type: 'privacy',
          title: 'Privacy Policy',
          sections: [
            { id: '1', title: 'Information We Collect', content: 'We collect information you provide when you interact with our services (e.g., reservations, orders, support requests).', order: 1 },
            { id: '2', title: 'How We Use Your Information', content: 'We use your information to provide and improve our services, process requests, and communicate with you.', order: 2 },
            { id: '3', title: 'Data Protection', content: 'We implement industry‑standard security measures and do not sell your personal data.', order: 3 }
          ]
        },
        {
          type: 'terms',
          title: 'Terms of Service',
          sections: [
            { id: '1', title: 'Acceptance of Terms', content: 'By using our services, you agree to these terms. If you do not agree, please do not use our services.', order: 1 },
            { id: '2', title: 'Reservations and Cancellations', content: 'Reservations are subject to availability. Cancellation terms vary by service type.', order: 2 },
            { id: '3', title: 'Dining and Services', content: 'Menu items and prices may change. We strive to accommodate dietary requests when possible.', order: 3 }
          ]
        },
        {
          type: 'accessibility',
          title: 'Accessibility Statement',
          sections: [
            { id: '1', title: 'Our Commitment', content: 'We are committed to ensuring digital accessibility for all users and continually improving the experience.', order: 1 },
            { id: '2', title: 'Accessibility Features', content: 'Keyboard navigation, screen reader compatibility, and high‑contrast options are supported.', order: 2 },
            { id: '3', title: 'Physical Accessibility', content: 'Facilities are designed to be accessible. Contact us to discuss specific requirements.', order: 3 }
          ]
        },
        {
          type: 'careers',
          title: 'Careers',
          sections: [
            { id: '1', title: 'Join Our Team', content: "We're always looking for passionate individuals to join our team.", order: 1 },
            { id: '2', title: 'Available Positions', content: 'Opportunities in hospitality, culinary, guest services, maintenance, and management.', order: 2 },
            { id: '3', title: 'Benefits', content: 'Competitive wages, health insurance, paid time off, employee discounts, and growth opportunities.', order: 3 },
            { id: '4', title: 'How to Apply', content: 'Send your resume and cover letter to careers@portantonio.com.', order: 4 }
          ]
        }
      ];

      const { error: legalInsertError } = await supabaseAdmin
        .from('legal_pages')
        .insert(legalPages as any);

      if (legalInsertError) throw legalInsertError;
    }

    return NextResponse.json({ success: true, message: 'Content initialized successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to initialize content' }, { status: 500 })
  }
}
