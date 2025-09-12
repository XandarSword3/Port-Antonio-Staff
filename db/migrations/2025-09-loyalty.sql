-- Loyalty System Migration
-- Run this in Supabase SQL Editor

-- Create loyalty_accounts table
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE, -- Can be NULL for guest loyalty accounts
    email VARCHAR(255), -- For guest accounts without user_id
    phone VARCHAR(20), -- Alternative identifier for guest accounts
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_earned INTEGER DEFAULT 0, -- Historical total points earned
    total_redeemed INTEGER DEFAULT 0, -- Historical total points redeemed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure at least one identifier exists
    CONSTRAINT loyalty_accounts_identifier_check CHECK (
        user_id IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL
    )
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loyalty_account_id UUID REFERENCES loyalty_accounts(id) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust')) NOT NULL,
    points INTEGER NOT NULL, -- Positive for earn, negative for redeem/expire
    reason VARCHAR(255) NOT NULL,
    reference_type VARCHAR(50), -- 'reservation', 'order', 'manual', etc.
    reference_id UUID, -- ID of the related entity (reservation_id, order_id, etc.)
    staff_user_id UUID REFERENCES staff_users(id), -- Staff member who created the transaction
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional data about the transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- For point expiration tracking
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_email ON loyalty_accounts(email);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_phone ON loyalty_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account_id ON loyalty_transactions(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_reference ON loyalty_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_staff_user ON loyalty_transactions(staff_user_id);

-- Create updated_at trigger for loyalty_accounts
CREATE TRIGGER update_loyalty_accounts_updated_at 
    BEFORE UPDATE ON loyalty_accounts 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_accounts
CREATE POLICY "Staff can view all loyalty accounts" ON loyalty_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id = auth.uid() 
            AND staff_users.is_active = true
        )
    );

CREATE POLICY "Staff can insert loyalty accounts" ON loyalty_accounts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id = auth.uid() 
            AND staff_users.is_active = true
        )
    );

CREATE POLICY "Staff can update loyalty accounts" ON loyalty_accounts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id = auth.uid() 
            AND staff_users.is_active = true
        )
    );

-- RLS Policies for loyalty_transactions
CREATE POLICY "Staff can view all loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id = auth.uid() 
            AND staff_users.is_active = true
        )
    );

CREATE POLICY "Staff can insert loyalty transactions" ON loyalty_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff_users 
            WHERE staff_users.id = auth.uid() 
            AND staff_users.is_active = true
        )
    );

-- Function to automatically update account points when transactions are added
CREATE OR REPLACE FUNCTION update_loyalty_account_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the account points
    UPDATE loyalty_accounts 
    SET 
        points = points + NEW.points,
        total_earned = CASE 
            WHEN NEW.transaction_type = 'earn' THEN total_earned + NEW.points
            ELSE total_earned
        END,
        total_redeemed = CASE 
            WHEN NEW.transaction_type IN ('redeem', 'expire') THEN total_redeemed + ABS(NEW.points)
            ELSE total_redeemed
        END,
        updated_at = NOW()
    WHERE id = NEW.loyalty_account_id;
    
    -- Update tier based on total earned points
    UPDATE loyalty_accounts
    SET tier = CASE
        WHEN total_earned >= 10000 THEN 'platinum'
        WHEN total_earned >= 5000 THEN 'gold'
        WHEN total_earned >= 2000 THEN 'silver'
        ELSE 'bronze'
    END
    WHERE id = NEW.loyalty_account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update account points
DROP TRIGGER IF EXISTS trigger_update_loyalty_account_points ON loyalty_transactions;
CREATE TRIGGER trigger_update_loyalty_account_points
    AFTER INSERT ON loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION update_loyalty_account_points();

-- Function to handle point expiration
CREATE OR REPLACE FUNCTION expire_loyalty_points()
RETURNS void AS $$
DECLARE
    expired_transaction RECORD;
BEGIN
    -- Find points that have expired but haven't been processed
    FOR expired_transaction IN
        SELECT 
            loyalty_account_id,
            SUM(points) as expired_points
        FROM loyalty_transactions
        WHERE 
            transaction_type = 'earn' 
            AND expires_at < NOW()
            AND id NOT IN (
                SELECT reference_id::UUID 
                FROM loyalty_transactions 
                WHERE transaction_type = 'expire' 
                AND reference_type = 'expiration'
                AND reference_id IS NOT NULL
            )
        GROUP BY loyalty_account_id
        HAVING SUM(points) > 0
    LOOP
        -- Create expiration transaction
        INSERT INTO loyalty_transactions (
            loyalty_account_id,
            transaction_type,
            points,
            reason,
            reference_type,
            metadata
        ) VALUES (
            expired_transaction.loyalty_account_id,
            'expire',
            -expired_transaction.expired_points,
            'Points expired',
            'expiration',
            jsonb_build_object('expired_points', expired_transaction.expired_points)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add default point expiration (2 years from earn date)
CREATE OR REPLACE FUNCTION set_point_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'earn' AND NEW.expires_at IS NULL THEN
        NEW.expires_at = NOW() + INTERVAL '2 years';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_loyalty_point_expiration
    BEFORE INSERT ON loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION set_point_expiration();

-- Insert some sample loyalty accounts for testing
INSERT INTO loyalty_accounts (email, points, tier, total_earned, total_redeemed) VALUES
('john.doe@email.com', 1250, 'silver', 2500, 1250),
('jane.smith@email.com', 750, 'bronze', 750, 0),
('bob.wilson@email.com', 3200, 'gold', 5200, 2000)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE loyalty_accounts IS 'Customer loyalty program accounts with points and tier tracking';
COMMENT ON TABLE loyalty_transactions IS 'All loyalty point transactions with audit trail';
COMMENT ON FUNCTION update_loyalty_account_points() IS 'Automatically updates account points and tier when transactions are added';
COMMENT ON FUNCTION expire_loyalty_points() IS 'Processes expired loyalty points (should be run as scheduled job)';
