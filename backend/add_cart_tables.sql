-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    to_go_item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES user (id),
    FOREIGN KEY (to_go_item_id) REFERENCES to_go_item (id),
    UNIQUE(recipient_id, to_go_item_id)
);

-- Cart Notifications Table
CREATE TABLE IF NOT EXISTS cart_notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'item_added_to_cart', 'item_sold_out', 'item_purchased'
    to_go_item_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (to_go_item_id) REFERENCES to_go_item (id)
);

-- Update to_go_item table to add quantity tracking
ALTER TABLE to_go_item ADD COLUMN quantity_available INTEGER DEFAULT 1;
ALTER TABLE to_go_item ADD COLUMN quantity_sold INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_cart_recipient ON shopping_cart(recipient_id);
CREATE INDEX IF NOT EXISTS idx_cart_item ON shopping_cart(to_go_item_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON cart_notification(user_id);
