# Customer Website Integration Guide

## Required Customer Website API Endpoints

The staff portal needs these endpoints from the customer website (port-antonio.com) to function properly:

### 1. Menu Data Sync
**Endpoint:** `GET https://port-antonio.com/api/menu`
**Purpose:** Import menu items from customer website
**Response Format:**
```json
{
  "categories": [
    {
      "id": "1",
      "name": "Appetizers",
      "slug": "appetizers",
      "items": [
        {
          "id": "101",
          "name": "Jerk Chicken Wings",
          "description": "Spicy wings with our signature jerk seasoning",
          "price": 14.99,
          "currency": "USD",
          "image": "https://port-antonio.com/images/jerk-wings.jpg",
          "allergens": ["gluten"],
          "dietary": ["spicy"],
          "availability": true
        }
      ]
    }
  ]
}
```

### 2. Legal Pages Content
**Endpoint:** `GET https://port-antonio.com/api/legal`
**Purpose:** Sync legal pages content
**Response Format:**
```json
{
  "pages": [
    {
      "slug": "privacy-policy",
      "title": "Privacy Policy",
      "content": "<html content>",
      "last_updated": "2024-01-15T10:30:00Z"
    },
    {
      "slug": "terms-of-service", 
      "title": "Terms of Service",
      "content": "<html content>",
      "last_updated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Reservation Webhook
**Endpoint:** `POST https://your-staff-portal.vercel.app/api/webhook/reservations`
**Purpose:** Customer website sends new reservations to staff portal
**Payload:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1-555-123-4567",
  "party_size": 4,
  "reservation_date": "2024-02-15",
  "reservation_time": "19:00",
  "special_requests": "Anniversary dinner",
  "source": "website"
}
```

### 4. Order Webhook
**Endpoint:** `POST https://your-staff-portal.vercel.app/api/webhook/orders`
**Purpose:** Customer website sends online orders to staff portal
**Payload:**
```json
{
  "order_number": "ORD-2024-001",
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "customer_phone": "+1-555-987-6543",
  "order_type": "delivery",
  "delivery_address": "123 Main St, Kingston",
  "items": [
    {
      "menu_item_id": "101",
      "name": "Jerk Chicken Wings",
      "quantity": 2,
      "price": 14.99,
      "special_instructions": "Extra spicy"
    }
  ],
  "subtotal": 29.98,
  "tax": 3.60,
  "delivery_fee": 5.00,
  "total": 38.58,
  "payment_status": "paid"
}
```

## Staff Portal API Endpoints (for customer website)

### 1. Menu Updates Webhook
**Endpoint:** `POST https://your-staff-portal.vercel.app/api/webhook/menu-updates`
**Purpose:** Notify customer website when menu changes
**Authentication:** Bearer token or webhook secret

### 2. Event Updates Webhook  
**Endpoint:** `POST https://your-staff-portal.vercel.app/api/webhook/event-updates`
**Purpose:** Notify customer website when events are created/updated
**Authentication:** Bearer token or webhook secret

## Setup Instructions

### 1. Environment Variables
Add these to your Vercel deployment:

```env
# Customer website integration
CUSTOMER_WEBSITE_URL=https://port-antonio.com
CUSTOMER_API_KEY=your_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Authentication Setup
The customer website should authenticate API calls using:
- API Key in header: `X-API-Key: your_api_key_here`
- Or Bearer token: `Authorization: Bearer your_token_here`

### 3. Webhook Security
All webhooks should include a signature for verification:
```
X-Webhook-Signature: sha256=hash_of_payload_with_secret
```

### 4. Rate Limiting
Implement rate limiting on both sides:
- Customer website: Max 100 requests per minute per endpoint
- Staff portal: Max 50 webhook deliveries per minute

## Implementation Status

### ✅ Completed in Staff Portal
- Database schema with all required tables
- Image upload system for menu items
- Real-time notifications system
- Metrics and analytics dashboard
- Order and reservation management
- Kitchen display system
- Staff management with role-based access
- Event management system

### 🔧 Required on Customer Website
- [ ] Menu API endpoint (`/api/menu`)
- [ ] Legal pages API endpoint (`/api/legal`)
- [ ] Webhook integration for reservations
- [ ] Webhook integration for orders
- [ ] API authentication system
- [ ] Webhook signature verification

### 🔧 Required Integration Work
- [ ] Create webhook receiver endpoints in staff portal
- [ ] Implement data sync scripts
- [ ] Set up authentication between systems
- [ ] Configure webhook delivery and retry logic
- [ ] Add error handling and logging
- [ ] Test end-to-end data flow

## Data Sync Scripts

The staff portal includes several scripts in the `/scripts` folder:

1. **`import-menu.js`** - Import menu from customer website
2. **`import-legal.js`** - Import legal pages
3. **`sync-reservations.js`** - Sync reservation data
4. **`sync-orders.js`** - Sync order data

Run these scripts periodically or on-demand to keep data in sync.

## Testing Checklist

- [ ] Menu import from customer website works
- [ ] Legal pages sync properly
- [ ] Reservations flow from website to staff portal
- [ ] Orders flow from website to staff portal
- [ ] Image uploads work for menu items
- [ ] Kitchen display shows orders correctly
- [ ] Notifications appear for new reservations/orders
- [ ] Metrics calculate correctly from real data
- [ ] Staff can manage all entities (menu, events, etc.)
- [ ] Role-based permissions work properly

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure customer website allows staff portal domain
2. **Authentication Failures**: Check API keys and token expiration
3. **Webhook Delivery Failures**: Implement retry logic with exponential backoff
4. **Data Validation Errors**: Ensure payload formats match exactly
5. **Rate Limiting**: Implement proper throttling and queuing

### Monitoring
Set up monitoring for:
- Webhook delivery success rates
- API response times
- Database connection health
- Image upload success rates
- User authentication failures
