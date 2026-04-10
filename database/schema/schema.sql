CREATE TYPE user_role AS ENUM ('farmer', 'landlord', 'industry');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'fulfilled', 'cancelled');

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS land (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(120) NOT NULL,
    acres NUMERIC(10, 2) NOT NULL CHECK (acres > 0),
    price_per_acre NUMERIC(12, 2) NOT NULL CHECK (price_per_acre >= 0),
    available_from DATE NOT NULL,
    available_to DATE NOT NULL,
    CONSTRAINT land_available_range_check CHECK (available_to >= available_from)
);

CREATE TABLE IF NOT EXISTS crops (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_name VARCHAR(120) NOT NULL,
    expected_yield NUMERIC(12, 2) NOT NULL CHECK (expected_yield >= 0),
    season VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    land_id BIGINT NOT NULL REFERENCES land(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    CONSTRAINT booking_date_range_check CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    industry_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status order_status NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_land_owner_id ON land(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_location ON land(location);
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_name ON crops(crop_name);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_land_id ON bookings(land_id);
CREATE INDEX IF NOT EXISTS idx_orders_industry_id ON orders(industry_id);
CREATE INDEX IF NOT EXISTS idx_orders_crop_id ON orders(crop_id);
