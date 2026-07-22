-- Enterprise Doctor Schema Definition
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'doctor',
    specialization VARCHAR(255),
    license_number VARCHAR(100),
    hospital_affinity VARCHAR(255),
    consultation_fee DECIMAL(10, 2),
    available_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
