const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedLegalPages() {
  console.log('Seeding legal pages...')

  const legalPages = [
    {
      type: 'privacy',
      title: 'Privacy Policy',
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          content: 'Port San Antonio respects your privacy and is committed to protecting your personal information. This privacy policy explains how we collect, use, and safeguard your data when you visit our restaurant or use our services.',
          order: 1
        },
        {
          id: 'data-collection',
          title: 'Information We Collect',
          content: 'We may collect personal information such as your name, email address, phone number, and dining preferences when you make reservations, place orders, or sign up for our newsletter.',
          order: 2
        },
        {
          id: 'data-use',
          title: 'How We Use Your Information',
          content: 'We use your information to process reservations, fulfill orders, communicate with you about your dining experience, and provide personalized service.',
          order: 3
        },
        {
          id: 'data-protection',
          title: 'Data Protection',
          content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
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
          content: 'By visiting Port San Antonio or using our services, you agree to comply with and be bound by these terms of service.',
          order: 1
        },
        {
          id: 'reservations',
          title: 'Reservations',
          content: 'Reservations are subject to availability. We reserve the right to cancel or modify reservations due to unforeseen circumstances.',
          order: 2
        },
        {
          id: 'payment',
          title: 'Payment Terms',
          content: 'Payment is required at the time of service. We accept cash and major credit cards. Gratuity is appreciated but not mandatory.',
          order: 3
        },
        {
          id: 'conduct',
          title: 'Guest Conduct',
          content: 'We expect all guests to behave respectfully towards our staff and other patrons. We reserve the right to refuse service.',
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
          title: 'Our Commitment',
          content: 'Port San Antonio is committed to providing a welcoming and accessible dining experience for all guests, including those with disabilities.',
          order: 1
        },
        {
          id: 'facilities',
          title: 'Accessible Facilities',
          content: 'Our restaurant features wheelchair-accessible entrances, restrooms, and seating areas. We also provide assistance for guests with visual or hearing impairments.',
          order: 2
        },
        {
          id: 'menu-accessibility',
          title: 'Menu Accessibility',
          content: 'We offer large-print menus and can accommodate various dietary restrictions and allergies. Please inform your server of any special needs.',
          order: 3
        },
        {
          id: 'feedback',
          title: 'Accessibility Feedback',
          content: 'We welcome feedback on our accessibility efforts. Please contact us with any suggestions or concerns about improving our services.',
          order: 4
        }
      ]
    }
  ]

  try {
    // Insert legal pages
    for (const page of legalPages) {
      const { data, error } = await supabase
        .from('legal_pages')
        .upsert(page, { onConflict: 'type' })
        .select()

      if (error) {
        console.error(`Error inserting ${page.type}:`, error)
      } else {
        console.log(`✓ Inserted ${page.type} page`)
      }
    }

    console.log('Legal pages seeded successfully!')
  } catch (error) {
    console.error('Error seeding legal pages:', error)
    process.exit(1)
  }
}

seedLegalPages()
