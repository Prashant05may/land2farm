INSERT INTO users (id, name, role, phone, location) VALUES
    (1, 'Ramesh Patel', 'farmer', '9876543210', 'Nashik'),
    (2, 'Sunita Sharma', 'landlord', '9123456780', 'Pune'),
    (3, 'Green Harvest Foods', 'industry', '9988776655', 'Mumbai'),
    (4, 'Amit Verma', 'farmer', '9012345678', 'Nagpur')
ON CONFLICT (id) DO NOTHING;

INSERT INTO land (id, owner_id, location, acres, price_per_acre, available_from, available_to) VALUES
    (1, 2, 'Pune', 12.50, 1800.00, DATE '2026-07-01', DATE '2026-12-31'),
    (2, 2, 'Satara', 8.00, 1500.00, DATE '2026-01-01', DATE '2026-06-30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crops (id, farmer_id, crop_name, expected_yield, season) VALUES
    (1, 1, 'Wheat', 18.50, 'Rabi'),
    (2, 4, 'Soybean', 10.00, 'Kharif')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookings (id, farmer_id, land_id, start_date, end_date, status) VALUES
    (1, 1, 1, DATE '2026-07-01', DATE '2026-12-31', 'confirmed'),
    (2, 4, 2, DATE '2026-01-01', DATE '2026-06-30', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, industry_id, crop_id, quantity, price, status) VALUES
    (1, 3, 1, 6.50, 14500.00, 'confirmed'),
    (2, 3, 2, 3.00, 7200.00, 'pending')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('land_id_seq', COALESCE((SELECT MAX(id) FROM land), 1), true);
SELECT setval('crops_id_seq', COALESCE((SELECT MAX(id) FROM crops), 1), true);
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 1), true);
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1), true);
