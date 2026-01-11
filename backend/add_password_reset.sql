-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_token (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_token(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_token(user_id);
