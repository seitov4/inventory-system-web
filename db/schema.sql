CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    store_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- cashier | manager | owner | admin
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT users_email_or_phone_chk CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(255),
    barcode VARCHAR(100) UNIQUE,
    purchase_price NUMERIC(10,2),
    sale_price NUMERIC(10,2),
    min_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS warehouses (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    address TEXT
    );

CREATE TABLE IF NOT EXISTS stock (
                                     id SERIAL PRIMARY KEY,
                                     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE (product_id, warehouse_id)
    );

CREATE TABLE IF NOT EXISTS movements (
                                         id SERIAL PRIMARY KEY,
                                         product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- IN | OUT | TRANSFER | SALE | RETURN | ADJUST
    warehouse_from INTEGER REFERENCES warehouses(id),
    warehouse_to INTEGER REFERENCES warehouses(id),
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS sales (
                                     id SERIAL PRIMARY KEY,
                                     cashier_id INTEGER REFERENCES users(id),
    store_id INTEGER REFERENCES warehouses(id),
    total NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0,
    payment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS sale_items (
                                          id SERIAL PRIMARY KEY,
                                          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0
    );

CREATE TABLE IF NOT EXISTS notifications (
                                             id SERIAL PRIMARY KEY,
                                             type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    payload JSONB,
    status VARCHAR(20) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
    );