-- Update surplus_item table to add quantity tracking
ALTER TABLE surplus_item ADD COLUMN quantity_available INTEGER DEFAULT 10;
ALTER TABLE surplus_item ADD COLUMN quantity_sold INTEGER DEFAULT 0;

-- Update shopping_cart foreign key reference
DROP TABLE IF EXISTS shopping_cart;
CREATE TABLE shopping_cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    surplus_item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES user (id),
    FOREIGN KEY (surplus_item_id) REFERENCES surplus_item (id),
    UNIQUE(recipient_id, surplus_item_id)
);

-- Update cart_notification foreign key reference
DROP TABLE IF EXISTS cart_notification;
CREATE TABLE cart_notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    surplus_item_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (surplus_item_id) REFERENCES surplus_item (id)
);

CREATE INDEX IF NOT EXISTS idx_cart_recipient ON shopping_cart(recipient_id);
CREATE INDEX IF NOT EXISTS idx_cart_item ON shopping_cart(surplus_item_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON cart_notification(user_id);
