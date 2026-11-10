-- ==============================================================================
-- Course Mania - Centralized Multi-Tenant Telegram Bot Platform Database Schema
-- Target Engine: PostgreSQL 14+ / 16+
-- ==============================================================================

/*
Mermaid ER Diagram:
-------------------
```mermaid
erDiagram
    users ||--o{ audit_logs : generates
    reseller_accounts ||--|| telegram_bots : owns
    reseller_accounts ||--o{ financial_ledger_entries : tracks
    reseller_accounts ||--o{ reseller_payment_records : records
    telegram_bots ||--o{ orders : receives
    courses ||--o{ orders : contains
    orders ||--o{ payments : verifies
    orders ||--o{ course_fulfillments : delivers
    orders ||--o{ financial_ledger_entries : creates

    reseller_accounts {
        uuid id PK
        varchar name
        varchar phone
        varchar email
        numeric credit_limit
        numeric accrued_owner_share
        numeric verified_reseller_payments
        numeric outstanding_balance
        varchar status
    }

    telegram_bots {
        uuid id PK
        varchar name
        varchar username
        text token_encrypted
        boolean is_primary_owner_bot
        uuid reseller_id FK
        varchar status
        text webhook_url
        varchar webhook_secret
    }

    courses {
        uuid id PK
        varchar title
        varchar title_bn
        text description
        varchar category
        numeric regular_price
        numeric sale_price
        boolean is_sale_active
        varchar status
        varchar delivery_method
        text delivery_payload
    }

    orders {
        uuid id PK
        varchar order_number
        uuid bot_id FK
        uuid reseller_id FK
        uuid course_id FK
        bigint customer_telegram_id
        varchar customer_name
        numeric sale_price
        numeric owner_share_50
        numeric reseller_share_50
        varchar status
        varchar payment_method
        varchar payment_trx_id
    }

    financial_ledger_entries {
        uuid id PK
        uuid reseller_id FK
        uuid order_id FK
        varchar entry_type
        numeric gross_amount
        numeric owner_share_delta
        numeric reseller_payment_delta
        numeric balance_after
        varchar reference
        timestamp created_at
    }
```
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Reseller Accounts
CREATE TABLE IF NOT EXISTS reseller_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 5000.00 CHECK (credit_limit >= 0),
    accrued_owner_share NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    verified_reseller_payments NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    approved_adjustments NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reseller_status ON reseller_accounts(status);
CREATE INDEX IF NOT EXISTS idx_reseller_phone ON reseller_accounts(phone);

-- 2. Telegram Bots
CREATE TABLE IF NOT EXISTS telegram_bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    token_encrypted TEXT NOT NULL,
    token_masked VARCHAR(50) NOT NULL,
    is_primary_owner_bot BOOLEAN NOT NULL DEFAULT FALSE,
    reseller_id UUID REFERENCES reseller_accounts(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    webhook_url TEXT NOT NULL,
    webhook_secret VARCHAR(64) NOT NULL,
    last_webhook_ping TIMESTAMPTZ,
    total_orders_count INT NOT NULL DEFAULT 0,
    total_gross_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bots_username ON telegram_bots(username);
CREATE INDEX IF NOT EXISTS idx_bots_reseller_id ON telegram_bots(reseller_id);

-- 3. Courses (Shared Catalog)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_bn TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    regular_price NUMERIC(10, 2) NOT NULL CHECK (regular_price >= 0),
    sale_price NUMERIC(10, 2) NOT NULL CHECK (sale_price >= 0),
    is_sale_active BOOLEAN NOT NULL DEFAULT TRUE,
    thumbnail_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    delivery_method VARCHAR(50) NOT NULL DEFAULT 'telegram_channel',
    delivery_payload TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    total_enrolled INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- 4. Customer Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) NOT NULL UNIQUE,
    bot_id UUID NOT NULL REFERENCES telegram_bots(id),
    reseller_id UUID REFERENCES reseller_accounts(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    customer_telegram_id BIGINT NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_username VARCHAR(100),
    customer_phone VARCHAR(30),
    unit_price NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2) NOT NULL,
    owner_share_50 NUMERIC(10, 2) NOT NULL,
    reseller_share_50 NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'awaiting_payment' CHECK (
        status IN (
            'created',
            'awaiting_payment',
            'payment_submitted',
            'payment_pending_verification',
            'paid',
            'paid_pending_fulfillment',
            'fulfilled',
            'cancelled',
            'refunded',
            'delivery_failed'
        )
    ),
    payment_method VARCHAR(50),
    payment_trx_id VARCHAR(100),
    payment_sender_number VARCHAR(30),
    payment_submitted_at TIMESTAMPTZ,
    payment_verified_at TIMESTAMPTZ,
    verified_by VARCHAR(100),
    fulfillment_details JSONB,
    rejection_reason TEXT,
    refund_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_bot_id ON orders(bot_id);
CREATE INDEX IF NOT EXISTS idx_orders_reseller_id ON orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_orders_trx_id ON orders(payment_trx_id);

-- 5. Immutable Financial Ledger Entries (Accounting Engine)
CREATE TABLE IF NOT EXISTS financial_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID NOT NULL REFERENCES reseller_accounts(id),
    bot_id UUID REFERENCES telegram_bots(id),
    order_id UUID REFERENCES orders(id),
    order_number VARCHAR(30),
    entry_type VARCHAR(40) NOT NULL CHECK (
        entry_type IN (
            'SALE_ACCRUAL',
            'SALE_REFUND',
            'RESELLER_PAYMENT',
            'ADMIN_ADJUSTMENT',
            'CREDIT_LIMIT_CHANGE'
        )
    ),
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    owner_share_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reseller_payment_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    adjustment_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_reseller_id ON financial_ledger_entries(reseller_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON financial_ledger_entries(created_at);

-- 6. Reseller Payment Records (Money received from resellers)
CREATE TABLE IF NOT EXISTS reseller_payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID NOT NULL REFERENCES reseller_accounts(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    trx_id VARCHAR(100) NOT NULL,
    notes TEXT,
    recorded_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
