-- Complete Database Setup Script for Port Antonio Staff Portal
-- Run this in Supabase SQL Editor

-- 1. CREATE MISSING TABLES

-- Kitchen tickets table (if not exists)
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    order_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    table_number VARCHAR(10),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) CHECK (status IN ('pending', 'preparing', 'ready', 'served')) DEFAULT 'pending',
    priority VARCHAR(10) CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    special_instructions TEXT,
    estimated_time INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff activity/audit log table (if not exists)
CREATE TABLE IF NOT EXISTS staff_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES staff_users(id) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (if not exists)
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_capacity INTEGER,
    current_capacity INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    image TEXT,
    category VARCHAR(20) CHECK (category IN ('conference', 'dining', 'entertainment', 'special')) DEFAULT 'dining',
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
    featured_until DATE,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON reservations(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_staff_activity_user_id ON staff_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_timestamp ON staff_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- 3. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. APPLY UPDATED_AT TRIGGERS TO ALL TABLES
CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kitchen_tickets_updated_at BEFORE UPDATE ON kitchen_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON footer_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON legal_pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. ENABLE ROW LEVEL SECURITY AND CREATE POLICIES

-- Kitchen tickets
ALTER TABLE kitchen_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen staff can manage tickets" ON kitchen_tickets
FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner') OR auth.role() = 'authenticated');

-- Staff activity
ALTER TABLE staff_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all activity" ON staff_activity
FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','owner'));
CREATE POLICY "Users can view their own activity" ON staff_activity
FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can log activity" ON staff_activity
FOR INSERT USING (true);

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events" ON events
FOR SELECT USING (status = 'published' OR auth.jwt() ->> 'role' IN ('admin','owner'));
CREATE POLICY "Admins can manage events" ON events
FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner'));

-- 6. INSERT SAMPLE DATA FOR TESTING

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message) VALUES
-- Replace with actual staff user IDs or use a placeholder
('00000000-0000-0000-0000-000000000000', 'info', 'Welcome!', 'Welcome to the staff portal system.'),
('00000000-0000-0000-0000-000000000000', 'warning', 'Low Inventory', 'Check ingredient levels for tonight service.'),
('00000000-0000-0000-0000-000000000000', 'success', 'Order Complete', 'Table 5 order has been served successfully.')
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, date, start_time, end_time, location, max_capacity, price, category, status) VALUES
('Wine Tasting Evening', 'Join us for an exclusive wine tasting featuring local Jamaican wines and international selections.', CURRENT_DATE + INTERVAL '7 days', '18:00', '21:00', 'Main Dining Room', 50, 75.00, 'entertainment', 'published'),
('Chef Special Dinner', 'Limited seating for our chef''s signature 7-course tasting menu.', CURRENT_DATE + INTERVAL '14 days', '19:00', '22:00', 'Private Dining', 20, 150.00, 'dining', 'published'),
('Live Jazz Night', 'Enjoy dinner with live jazz music from local musicians.', CURRENT_DATE + INTERVAL '3 days', '20:00', '23:00', 'Terrace', 80, 25.00, 'entertainment', 'published')
ON CONFLICT DO NOTHING;

-- 7. UPDATE EXISTING TABLES TO MATCH SCHEMA (if columns are missing)

-- Add missing columns to orders table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_by') THEN
        ALTER TABLE orders ADD COLUMN created_by UUID REFERENCES staff_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_by_name') THEN
        ALTER TABLE orders ADD COLUMN created_by_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'visible_to') THEN
        ALTER TABLE orders ADD COLUMN visible_to UUID[] DEFAULT '{}';
    END IF;
END $$;

-- Add missing columns to reservations table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'created_by') THEN
        ALTER TABLE reservations ADD COLUMN created_by UUID REFERENCES staff_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'created_by_name') THEN
        ALTER TABLE reservations ADD COLUMN created_by_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'visible_to') THEN
        ALTER TABLE reservations ADD COLUMN visible_to UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 8. CREATE SAMPLE STAFF USER (REPLACE WITH REAL DATA)
INSERT INTO staff_users (email, username, first_name, last_name, role, department, is_active, pin) VALUES
('admin@port-antonio.com', 'admin', 'Admin', 'User', 'owner', 'Management', true, '1234'),
('manager@port-antonio.com', 'manager', 'Restaurant', 'Manager', 'admin', 'Management', true, '5678'),
('chef@port-antonio.com', 'chef', 'Head', 'Chef', 'admin', 'Kitchen', true, '9999'),
('server@port-antonio.com', 'server', 'Service', 'Staff', 'worker', 'Front of House', true, '1111')
ON CONFLICT (email) DO NOTHING;
