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

    // Initialize legal pages (privacy, terms, accessibility)
    const legalPages = [
      {
        type: 'privacy',
        title: 'Privacy Policy',
        sections: [
          {
            id: 'intro',
            title: 'Introduction',
            content: 'At Port San Antonio Resort & Restaurant, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your information when you visit our resort, dine at our restaurant, or use our services.',
            order: 1
          },
          {
            id: 'data-collection',
            title: 'Information We Collect',
            content: 'We may collect personal information such as your name, contact details, reservation preferences, and payment information when you make reservations, dine with us, or use our services. We also collect information automatically through our website and digital systems to improve your experience.',
            order: 2
          },
          {
            id: 'data-use',
            title: 'How We Use Your Information',
            content: 'We use your personal information to provide and improve our services, process reservations and payments, communicate with you about your visits, and ensure the safety and security of our guests and staff.',
            order: 3
          },
          {
            id: 'data-protection',
            title: 'Data Protection',
            content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your information is stored securely and accessed only by authorized personnel.',
            order: 4
          }
        ]
      },
      {
        type: 'terms',
        title: 'Terms of Service',
        sections: [
          {
            id: 'acceptance',
            title: 'Acceptance of Terms',
            content: 'By visiting Port San Antonio Resort & Restaurant, making reservations, or using our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
            order: 1
          },
          {
            id: 'services',
            title: 'Our Services',
            content: 'Port San Antonio Resort & Restaurant provides luxury accommodation, fine dining, and hospitality services. We reserve the right to modify or discontinue any service at any time without notice.',
            order: 2
          },
          {
            id: 'reservations',
            title: 'Reservations and Cancellations',
            content: 'Reservations are subject to availability and our cancellation policy. Cancellations must be made within the specified timeframe to avoid charges. Special events and peak seasons may have different policies.',
            order: 3
          },
          {
            id: 'conduct',
            title: 'Guest Conduct',
            content: 'We expect all guests to conduct themselves in a respectful manner. We reserve the right to refuse service or remove guests who engage in disruptive, illegal, or inappropriate behavior.',
            order: 4
          }
        ]
      },
      {
        type: 'accessibility',
        title: 'Accessibility Statement',
        sections: [
          {
            id: 'commitment',
            title: 'Our Commitment to Accessibility',
            content: 'Port San Antonio Resort & Restaurant is committed to ensuring that our facilities and services are accessible to all guests, including those with disabilities. We strive to provide an inclusive and welcoming environment for everyone.',
            order: 1
          },
          {
            id: 'facilities',
            title: 'Accessible Facilities',
            content: 'Our resort features wheelchair-accessible rooms, ramps, accessible parking spaces, and adapted bathrooms. Our restaurant dining areas are designed to accommodate guests with mobility devices.',
            order: 2
          },
          {
            id: 'services',
            title: 'Accessibility Services',
            content: 'We offer assistance with luggage, accessible transportation options, and can accommodate special dietary requirements. Our staff is trained to provide courteous assistance to guests with disabilities.',
            order: 3
          },
          {
            id: 'feedback',
            title: 'Accessibility Feedback',
            content: 'We welcome feedback about the accessibility of our facilities and services. If you encounter any barriers or have suggestions for improvement, please contact our management team.',
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
