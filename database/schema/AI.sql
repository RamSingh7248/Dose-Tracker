-- Enterprise AI Session & Audit Schema Definition
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Conversation',
    category VARCHAR(50) DEFAULT 'patient_health',
    provider VARCHAR(50) DEFAULT 'gemini',
    is_pinned BOOLEAN DEFAULT FALSE,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    requested_provider VARCHAR(50),
    actual_provider VARCHAR(50),
    model_used VARCHAR(100),
    action VARCHAR(50),
    tokens_used INT DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
