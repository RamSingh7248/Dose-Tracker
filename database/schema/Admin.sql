-- Enterprise Admin Schema Definition
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    access_permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
