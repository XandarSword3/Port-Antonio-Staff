-- Create order_items table for detailed order tracking
-- This should be run in the Supabase SQL Editor or in the staff portal

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id TEXT NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON public.order_items(dish_id);

-- Enable Row Level Security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to order items
CREATE POLICY "Allow public read access to order items" ON public.order_items
    FOR SELECT USING (true);

-- Create policy to allow public insert access to order items  
CREATE POLICY "Allow public insert access to order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.order_items TO anon;
GRANT ALL ON public.order_items TO authenticated;

COMMENT ON TABLE public.order_items IS 'Individual items within an order';
COMMENT ON COLUMN public.order_items.order_id IS 'Reference to the parent order';
COMMENT ON COLUMN public.order_items.dish_id IS 'Reference to the ordered dish';
COMMENT ON COLUMN public.order_items.quantity IS 'Number of this dish ordered';
COMMENT ON COLUMN public.order_items.price IS 'Price of the dish at time of order';
