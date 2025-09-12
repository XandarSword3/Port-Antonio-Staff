import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const customerWebsiteUrl = process.env.CUSTOMER_WEBSITE_URL || 'https://port-antonio.com';
    const apiKey = process.env.CUSTOMER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Customer API key not configured' }, { status: 500 });
    }

    // Fetch menu data from customer website
    const response = await fetch(`${customerWebsiteUrl}/api/menu`, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch menu from customer website',
        status: response.status 
      }, { status: 502 });
    }

    const menuData = await response.json();

    return NextResponse.json({
      success: true,
      data: menuData,
      source: 'customer_website',
      fetched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching customer menu:', error);
    return NextResponse.json({ 
      error: 'Failed to connect to customer website',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint handles menu updates being pushed TO the customer website
    const customerWebsiteUrl = process.env.CUSTOMER_WEBSITE_URL || 'https://port-antonio.com';
    const apiKey = process.env.CUSTOMER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Customer API key not configured' }, { status: 500 });
    }

    const menuUpdates = await request.json();

    // Send updates to customer website
    const response = await fetch(`${customerWebsiteUrl}/api/menu/sync`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(menuUpdates),
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to sync menu to customer website',
        status: response.status 
      }, { status: 502 });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Menu synced to customer website successfully',
      result
    });

  } catch (error) {
    console.error('Error syncing menu to customer website:', error);
    return NextResponse.json({ 
      error: 'Failed to sync menu',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
