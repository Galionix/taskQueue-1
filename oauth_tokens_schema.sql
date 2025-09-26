-- OAuth tokens storage table
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at DATETIME,
    scopes TEXT, -- JSON array of granted scopes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);

-- OAuth state temporary storage (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- Index for state cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Sample data for testing (replace with real tokens after OAuth flow)
-- INSERT OR REPLACE INTO oauth_tokens (
--     user_id, 
--     provider, 
--     access_token, 
--     refresh_token, 
--     expires_at,
--     scopes
-- ) VALUES (
--     'user_123',
--     'google',
--     'your_access_token_here',
--     'your_refresh_token_here',
--     datetime('now', '+1 hour'),
--     '["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar"]'
-- );
