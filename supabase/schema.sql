-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create staff_users table
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('worker', 'admin', 'owner')) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES staff_users(id),
    last_login TIMESTAMP WITH TIME ZONE,
    pin VARCHAR(12) -- numeric or short alphanumeric PIN for quick login
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    table_number VARCHAR(10),
    special_requests TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show')) DEFAULT 'pending',
    created_by UUID REFERENCES staff_users(id) NOT NULL,
    created_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visible_to UUID[] DEFAULT '{}'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    table_number VARCHAR(10),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'stripe', 'pending')) DEFAULT 'pending',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')) DEFAULT 'pending',
    special_instructions TEXT,
    estimated_time INTEGER,
    created_by UUID REFERENCES staff_users(id) NOT NULL,
    created_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    dish_id VARCHAR(100) NOT NULL,
    dish_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    modifications TEXT,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table (synced from customer site)
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    allergens TEXT[],
    preparation_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Footer settings (single row expected)
CREATE TABLE IF NOT EXISTS footer_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dining_hours VARCHAR(255) NOT NULL,
    dining_location VARCHAR(255) NOT NULL,
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES staff_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal pages (privacy, terms, accessibility, careers)
CREATE TABLE IF NOT EXISTS legal_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(32) UNIQUE NOT NULL CHECK (type IN ('privacy','terms','accessibility','careers')),
    title VARCHAR(255) NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_by UUID REFERENCES staff_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Careers / Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('full-time','part-time','contract','internship')),
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    benefits TEXT[] NOT NULL DEFAULT '{}',
    salary VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES staff_users(id)
);

-- Create kitchen_tickets table
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(20) NOT NULL,
    table_number VARCHAR(10),
    items JSONB NOT NULL,
    special_instructions TEXT,
    status VARCHAR(20) CHECK (status IN ('new', 'preparing', 'ready', 'served')) DEFAULT 'new',
    priority VARCHAR(20) CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    estimated_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_activity table (audit log)
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

-- Create events table
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES staff_users(id) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kitchen_tickets_updated_at BEFORE UPDATE ON kitchen_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON footer_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON legal_pages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security Policies

-- Staff Users: Users can see others based on role hierarchy
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view themselves and subordinates" ON staff_users
    FOR SELECT USING (
        id = auth.uid()::text::uuid OR
        (auth.jwt() ->> 'role' = 'owner') OR
        (auth.jwt() ->> 'role' = 'admin' AND role != 'owner')
    );

-- Reservations: Visibility based on created_by and role hierarchy
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservation visibility by hierarchy" ON reservations
    FOR SELECT USING (
        created_by = auth.uid()::text::uuid OR
        auth.uid()::text::uuid = ANY(visible_to) OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

CREATE POLICY "Users can create reservations" ON reservations
    FOR INSERT WITH CHECK (created_by = auth.uid()::text::uuid);

CREATE POLICY "Users can update their reservations or admins can update any" ON reservations
    FOR UPDATE USING (
        created_by = auth.uid()::text::uuid OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

-- Orders: Similar hierarchy-based access
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order visibility by hierarchy" ON orders
    FOR SELECT USING (
        created_by = auth.uid()::text::uuid OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (created_by = auth.uid()::text::uuid);

CREATE POLICY "Users can update their orders or admins can update any" ON orders
    FOR UPDATE USING (
        created_by = auth.uid()::text::uuid OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

-- Order Items: Follow parent order permissions
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items follow order permissions" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.created_by = auth.uid()::text::uuid OR
                (auth.jwt() ->> 'role' IN ('admin', 'owner'))
            )
        )
    );

-- Kitchen Tickets: Kitchen staff and admins can see all
ALTER TABLE kitchen_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kitchen tickets for kitchen staff and admins" ON kitchen_tickets
    FOR SELECT USING (
        (auth.jwt() ->> 'department' = 'kitchen') OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

-- Staff Activity: Users can see their own, admins see all
ALTER TABLE staff_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log access by hierarchy" ON staff_activity
    FOR SELECT USING (
        user_id = auth.uid()::text::uuid OR
        (auth.jwt() ->> 'role' IN ('admin', 'owner'))
    );

CREATE POLICY "Users can log their own activity" ON staff_activity
    FOR INSERT WITH CHECK (user_id = auth.uid()::text::uuid);

-- Notifications: Users see their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid()::text::uuid);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Menu Items: All staff can view, admins can modify
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All staff can view menu items" ON menu_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can modify menu items" ON menu_items
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'owner'));

-- Footer settings: readable by all, modifiable by admins/owners
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read footer" ON footer_settings FOR SELECT USING (true);
CREATE POLICY "Modify footer (admins)" ON footer_settings FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner'));

-- Legal pages: readable by all, modifiable by admins/owners
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read legal" ON legal_pages FOR SELECT USING (true);
CREATE POLICY "Modify legal (admins)" ON legal_pages FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner'));

-- Jobs: readable by all, modifiable by admins/owners
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Modify jobs (admins)" ON jobs FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner'));

-- Events: readable by all, modifiable by admins/owners
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read events" ON events FOR SELECT USING (true);
CREATE POLICY "Modify events (admins)" ON events FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','owner'));
