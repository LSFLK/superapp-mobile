-- ============================================================================
-- SUPERAPP BACKEND - FULL DATABASE MIGRATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MICRO APPS (Parent table - must be created first)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS micro_app (
    id INT AUTO_INCREMENT PRIMARY KEY,
    micro_app_id VARCHAR(255) NOT NULL,
    name VARCHAR(1024) NOT NULL,
    description TEXT,
    promo_text VARCHAR(1024),
    icon_url VARCHAR(2083),
    banner_image_url VARCHAR(2083),
    created_by VARCHAR(319) NOT NULL,
    updated_by VARCHAR(319),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    active TINYINT(1) NOT NULL DEFAULT 1,
    mandatory TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE INDEX idx_micro_app_id (micro_app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. MICRO APP VERSIONS (FK -> micro_app.micro_app_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS micro_app_version (
    id INT AUTO_INCREMENT PRIMARY KEY,
    micro_app_id VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    build INT NOT NULL,
    release_notes TEXT,
    icon_url VARCHAR(2083),
    download_url VARCHAR(2083) NOT NULL,
    created_by VARCHAR(319) NOT NULL,
    updated_by VARCHAR(319),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_micro_app_id (micro_app_id),
    CONSTRAINT fk_version_microapp FOREIGN KEY (micro_app_id) 
        REFERENCES micro_app(micro_app_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. MICRO APP ROLES (FK -> micro_app.micro_app_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS micro_app_role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    micro_app_id VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    created_by VARCHAR(319) NOT NULL,
    updated_by VARCHAR(319),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_micro_app_id (micro_app_id),
    CONSTRAINT fk_role_microapp FOREIGN KEY (micro_app_id) 
        REFERENCES micro_app(micro_app_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. MICRO APP CONFIG (FK -> micro_app.micro_app_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS micro_app_config (
    micro_app_id VARCHAR(255) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSON NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(319) NOT NULL,
    updated_by VARCHAR(319),
    PRIMARY KEY (micro_app_id, config_key),
    CONSTRAINT fk_config_microapp FOREIGN KEY (micro_app_id) 
        REFERENCES micro_app(micro_app_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. DEVICE TOKENS (Standalone - no FK, references user by email)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    device_token TEXT NOT NULL,
    platform ENUM('ios', 'android') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_user_email (user_email),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. NOTIFICATION LOGS (Standalone - no FK, references by microapp_id string)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSON,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    microapp_id VARCHAR(100),
    INDEX idx_user_email (user_email),
    INDEX idx_microapp_id (microapp_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. OAUTH2 CLIENTS (for token-issure-service)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oauth2_clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scopes VARCHAR(1024),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE INDEX idx_client_id (client_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================