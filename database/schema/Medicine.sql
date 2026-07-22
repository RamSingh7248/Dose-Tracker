-- Enterprise Medicine & Dose Log Schema Definition
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    dosage_unit VARCHAR(50),
    frequency VARCHAR(50),
    times TEXT[],
    stock_quantity INT DEFAULT 0,
    refill_threshold INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dose_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    medication_id VARCHAR(36) NOT NULL REFERENCES medications(id),
    scheduled_time TIMESTAMP NOT NULL,
    taken_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'taken',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
