-- Port Antonio Staff Portal Database Schema
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_desc TEXT,
    full_desc TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    category_id TEXT REFERENCES categories(id),
    currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    status VARCHAR(20) CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')) DEFAULT 'pending',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial categories
INSERT INTO categories (id, name, order_index) VALUES
('beers', 'Beers', 1),
('arak', 'Arak', 2),
('drinks', 'Drinks', 3),
('appetizers', 'Appetizers', 4),
('main-courses', 'Main Courses', 5),
('desserts', 'Desserts', 6)
ON CONFLICT (id) DO NOTHING;

-- Insert admin user
INSERT INTO staff_users (email, username, first_name, last_name, role, department) VALUES
('admin@portantonio.com', 'admin', 'Port', 'Antonio Admin', 'owner', 'Management')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS policies (basic setup)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to dishes" ON dishes FOR SELECT USING (true);
CREATE POLICY "Allow read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow read access to reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow read access to staff_users" ON staff_users FOR SELECT USING (true);
