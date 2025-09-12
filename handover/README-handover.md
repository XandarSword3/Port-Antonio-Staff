# Port San Antonio Staff Portal - Handover Documentation

This document contains critical information for transferring ownership and maintaining the Port San Antonio Staff Portal system.

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### 1. Rotate Database Credentials

**CRITICAL**: The following files contain exposed database credentials that must be rotated immediately:

- `scripts/import-menu.js` (lines 7-8)
- `scripts/migrate-real-data.js` (lines 4-5)
- `scripts/complete-sync.js` (lines 4-5)

**Steps to secure:**

1. **Create new Supabase service role key:**
   ```bash
   # In Supabase Dashboard -> Settings -> API
   # Generate new service_role key
   # Copy the new key
   ```

2. **Update environment variables in Vercel:**
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # Paste the new service role key when prompted
   
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # Add your Supabase project URL
   ```

3. **Remove old credentials from code:**
   - Update all scripts to use `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - Remove hardcoded URLs and keys from all files

### 2. Required Environment Variables

Set up these environment variables in your deployment platform:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production

# Optional: Monitoring & Analytics
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id

# Optional: External Integrations
STRIPE_SECRET_KEY=your-stripe-key (if implementing payments)
TWILIO_ACCOUNT_SID=your-twilio-sid (for SMS notifications)
TWILIO_AUTH_TOKEN=your-twilio-token
SMTP_HOST=your-email-provider (for email notifications)
SMTP_USER=your-email-user
SMTP_PASS=your-email-password
```

## 📋 DEPLOYMENT CHECKLIST

### Vercel Deployment Steps

1. **Connect Repository:**
   ```bash
   # Link your GitHub repo to Vercel
   vercel --prod
   ```

2. **Set Environment Variables:**
   ```bash
   # Set all required environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # ... add all variables from the list above
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Database Migration Commands

Run these SQL commands in your Supabase SQL Editor:

```sql
-- 1. Run the complete database setup
-- Execute: complete-database-setup.sql

-- 2. Add loyalty system tables
-- Execute: db/migrations/2025-09-loyalty.sql

-- 3. Update reservation statuses (add new enum values)
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations 
ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'reminded', 'arrived', 'completed', 'cancelled', 'no_show'));

-- 4. Verify all indexes are created
SELECT indexname FROM pg_indexes WHERE tablename IN 
('staff_users', 'reservations', 'orders', 'menu_items', 'kitchen_tickets', 'loyalty_accounts', 'loyalty_transactions');
```

## 📊 DATA IMPORT & SEED SETUP

### Initial Content Setup

1. **Run setup verification:**
   ```bash
   node scripts/verify-setup.js
   ```

2. **Import menu data:**
   ```bash
   node scripts/import-menu.js
   ```

3. **Initialize legal content:**
   ```bash
   node scripts/initialize-content.js
   ```

4. **Sync with customer website:**
   ```bash
   node scripts/complete-sync.js
   ```

### Sample Data Creation

```sql
-- Create sample staff users
INSERT INTO staff_users (email, username, first_name, last_name, role, pin, is_active) VALUES
('admin@portsan.com', 'admin', 'Admin', 'User', 'admin', '$2a$10$example_hash', true),
('manager@portsan.com', 'manager', 'Jane', 'Manager', 'owner', '$2a$10$example_hash', true),
('kitchen@portsan.com', 'kitchen', 'Chef', 'Wilson', 'worker', '$2a$10$example_hash', true);

-- Create sample menu categories
INSERT INTO categories (name, description, "order") VALUES
('Appetizers', 'Start your meal with our delicious appetizers', 1),
('Main Courses', 'Our signature dishes and entrees', 2),
('Desserts', 'Sweet endings to your perfect meal', 3),
('Beverages', 'Refreshing drinks and specialty cocktails', 4);
```

## 🔧 MAINTENANCE PROCEDURES

### Regular Tasks

**Daily:**
- Monitor reservation system functionality
- Check kitchen display system
- Review staff activity logs

**Weekly:**
- Review loyalty program transactions
- Analyze reservation patterns
- Check for expired loyalty points: `SELECT expire_loyalty_points();`

**Monthly:**
- Generate value reports
- Review and rotate service keys
- Update menu items and pricing
- Backup critical data

### Database Maintenance

```sql
-- Clean up old notifications (older than 30 days)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';

-- Clean up old staff activity logs (older than 90 days)
DELETE FROM staff_activity WHERE timestamp < NOW() - INTERVAL '90 days';

-- Vacuum analyze for performance
VACUUM ANALYZE;
```

### Monitoring Commands

```bash
# Check system health
curl https://your-domain.com/api/health

# Verify database connection
node scripts/verify-setup.js

# Check environment variables
node scripts/check-env.js
```

## 🔒 SECURITY CONSIDERATIONS

### Access Control

**Staff Roles Hierarchy:**
- **Worker**: Kitchen display, basic order management
- **Admin**: Menu, reservations, events, basic analytics
- **Owner**: Full access including analytics, reports, staff management

**Database Security:**
- Row Level Security (RLS) enabled on all tables
- Service role key should only be used server-side
- Anon key for client-side operations only

### Regular Security Tasks

1. **Rotate service keys** (quarterly)
2. **Review staff access** (monthly)
3. **Update dependencies** (monthly)
4. **Security audit** (quarterly)

```bash
# Update dependencies
npm audit fix
npm update

# Check for security vulnerabilities
npm audit
```

## 📁 CRITICAL FILE LOCATIONS

```
├── src/
│   ├── app/api/                    # API endpoints
│   ├── components/                 # React components
│   ├── lib/                       # Utilities (Supabase client, etc.)
│   └── types/                     # TypeScript definitions
├── scripts/                       # Data management scripts
├── db/migrations/                 # Database migration files
├── complete-database-setup.sql    # Main database schema
└── public/uploads/                # File upload directory
```

**Never delete these files:**
- `complete-database-setup.sql` - Main database schema
- `src/lib/supabase.ts` - Database client configuration
- `src/types/index.ts` - Critical type definitions
- All files in `scripts/` directory

## 🆘 EMERGENCY PROCEDURES

### System Down

1. **Check Vercel deployment status**
2. **Verify database connectivity**
3. **Review recent deployments for breaking changes**
4. **Check environment variables are set correctly**

### Database Issues

```sql
-- Emergency read-only mode
ALTER USER your_user SET default_transaction_read_only = on;

-- Restore from backup
-- Contact Supabase support for backup restoration
```

### Lost Access

1. **Supabase Dashboard**: Reset password via email
2. **Vercel Dashboard**: Use GitHub SSO
3. **GitHub Repository**: Contact repository owner

## 📞 SUPPORT CONTACTS

**Technical Support:**
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com
- GitHub Support: support@github.com

**System Information:**
- Database: Supabase (PostgreSQL)
- Hosting: Vercel
- Framework: Next.js 13+ (App Router)
- Language: TypeScript

## 📈 SCALING CONSIDERATIONS

**Current Limitations:**
- Single database instance
- Local file storage (`public/uploads/`)
- No background job processing
- No caching layer

**Scaling Path:**
1. **Immediate (< 1000 users)**: Add Redis for caching
2. **Medium (1000-5000 users)**: Move to cloud file storage (AWS S3)
3. **Large (5000+ users)**: Implement read replicas, CDN, background jobs

## 📝 ADDITIONAL NOTES

- All timestamps are stored in UTC
- File uploads are limited to 5MB per file
- Loyalty points expire after 2 years
- Reservation reminders can be automated with cron jobs
- The system supports real-time updates via Supabase subscriptions

## ⚠️ FINAL REMINDERS

1. **IMMEDIATELY rotate all exposed credentials**
2. **Set up monitoring and error tracking**
3. **Create regular backup procedures**
4. **Document any custom configurations**
5. **Test all critical workflows after handover**

---

*Last updated: September 12, 2025*
*For questions about this handover, contact the original development team immediately.*
