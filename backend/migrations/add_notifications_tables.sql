-- Migration: Add Notifications System Tables
-- Date: 2024-12-02
-- Description: Create tables for real-time notifications and user preferences

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    shop_id INTEGER REFERENCES vendor_shops(id) ON DELETE CASCADE,
    item_id INTEGER,
    target_group VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    item_name VARCHAR(200),
    shop_name VARCHAR(200),
    quantity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_group ON notifications(target_group);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add comment to tables
COMMENT ON TABLE notifications IS 'Stores real-time notifications for new items posted by shops';
COMMENT ON TABLE notification_preferences IS 'Stores user preferences for notification settings';

-- Migration complete
