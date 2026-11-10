CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE revoked_token (
    token_id VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_revoked_token PRIMARY KEY (token_id)
);

CREATE TABLE stock (
    symbol VARCHAR(32) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    exchange_code VARCHAR(32) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_stock PRIMARY KEY (symbol)
);

CREATE TABLE watchlist_entry (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    stock_symbol VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_watchlist_entry PRIMARY KEY (id),
    CONSTRAINT uk_watchlist_user_stock UNIQUE (user_id, stock_symbol),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_stock FOREIGN KEY (stock_symbol)
        REFERENCES stock (symbol)
);

CREATE INDEX idx_watchlist_user_created
    ON watchlist_entry (user_id, created_at);
