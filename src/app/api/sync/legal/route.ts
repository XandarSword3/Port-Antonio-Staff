import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const customerWebsiteUrl = process.env.CUSTOMER_WEBSITE_URL || 'https://port-antonio.com';
    const apiKey = process.env.CUSTOMER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Customer API key not configured' }, { status: 500 });
    }

    // Fetch legal pages from customer website
    const response = await fetch(`${customerWebsiteUrl}/api/legal`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch legal pages from customer website',
        status: response.status 
      }, { status: 502 });
    }

    const legalData = await response.json();

    return NextResponse.json({
      success: true,
      data: legalData,
      source: 'customer_website',
      fetched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching customer legal pages:', error);
    return NextResponse.json({ 
      error: 'Failed to connect to customer website',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
