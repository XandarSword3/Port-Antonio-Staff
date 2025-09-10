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

    // Initialize legal pages
    const legalPages = [
      {
        type: 'privacy',
        title: 'Privacy Policy',
        sections: [
          {
            id: '1',
            title: 'Information We Collect',
            content: 'At Port Antonio Resort, we collect information you provide directly to us when you make reservations, place orders, or contact us for support. This includes your name, email address, phone number, and any special requests.',
            order: 1
          },
          {
            id: '2',
            title: 'How We Use Your Information',
            content: 'We use your information to provide exceptional service, process your reservations and orders, communicate with you about your stay, and improve our resort experience. Your data helps us personalize your visit and ensure your satisfaction.',
            order: 2
          },
          {
            id: '3',
            title: 'Data Protection',
            content: 'We implement industry-standard security measures to protect your personal information. We do not sell, trade, or share your personal information with third parties without your explicit consent, except as required by law.',
            order: 3
          },
          {
            id: '4',
            title: 'Contact Us',
            content: 'If you have any questions about this Privacy Policy, please contact us at info@portantonio.com or call +1 (876) 555-0123.',
            order: 4
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
            content: 'By accessing and using Port Antonio Resort\'s services, you accept and agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our services.',
            order: 1
          },
          {
            id: '2',
            title: 'Reservations and Cancellations',
            content: 'Reservations are subject to availability and confirmation. Cancellation policies vary by service type. Please review your specific reservation details for applicable terms. We reserve the right to modify or cancel reservations due to circumstances beyond our control.',
            order: 2
          },
          {
            id: '3',
            title: 'Dining and Services',
            content: 'Our dining services are available 24/7 at our Main Restaurant & Beachside locations. Menu items and prices are subject to change. We strive to accommodate dietary restrictions and special requests when possible.',
            order: 3
          },
          {
            id: '4',
            title: 'Limitation of Liability',
            content: 'Port Antonio Resort shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid by you for the specific service in question.',
            order: 4
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
            content: 'Port Antonio Resort is committed to ensuring digital accessibility for all guests, including those with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards.',
            order: 1
          },
          {
            id: '2',
            title: 'Accessibility Features',
            content: 'Our website includes features such as keyboard navigation, screen reader compatibility, high contrast options, and alternative text for images. We strive to make our digital content accessible to all users.',
            order: 2
          },
          {
            id: '3',
            title: 'Physical Accessibility',
            content: 'Our resort facilities are designed to be accessible to guests with mobility needs. We provide accessible dining areas, accommodations, and common spaces. Please contact us in advance to discuss specific accessibility requirements.',
            order: 3
          },
          {
            id: '4',
            title: 'Feedback and Support',
            content: 'If you encounter any accessibility barriers or need assistance, please contact us at info@portantonio.com or call +1 (876) 555-0123. We value your feedback and are committed to continuous improvement.',
            order: 4
          }
        ]
      },
      {
        type: 'careers',
        title: 'Careers',
        sections: [
          {
            id: '1',
            title: 'Join Our Team',
            content: 'At Port Antonio Resort, we\'re always looking for passionate individuals to join our team. We offer competitive benefits, growth opportunities, and the chance to work in a beautiful beachfront environment.',
            order: 1
          },
          {
            id: '2',
            title: 'Available Positions',
            content: 'We have opportunities in hospitality, culinary arts, guest services, maintenance, and management. Positions range from entry-level to senior management roles.',
            order: 2
          },
          {
            id: '3',
            title: 'Benefits',
            content: 'Our team members enjoy competitive wages, health insurance, paid time off, employee discounts, and opportunities for professional development and advancement.',
            order: 3
          },
          {
            id: '4',
            title: 'How to Apply',
            content: 'To apply for a position, please send your resume and cover letter to careers@portantonio.com or call +1 (876) 555-0123 to speak with our HR department.',
            order: 4
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
