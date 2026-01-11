-- Add town field to vendor_shop table for Northamptonshire location filtering
-- This allows shops to be categorized by specific towns within North and West Northamptonshire

ALTER TABLE vendor_shop 
ADD COLUMN town VARCHAR(50);

-- Add comment to explain the field
COMMENT ON COLUMN vendor_shop.town IS 'Town location: Wellingborough, Kettering, Corby, Northampton, Daventry, Brackley, or Towcester';

-- Update existing shops to have a default town (can be updated later by vendors)
UPDATE vendor_shop 
SET town = 'Northampton' 
WHERE town IS NULL;

-- Create index for faster filtering
CREATE INDEX idx_vendor_shop_town ON vendor_shop(town);
