-- Create pending_orders table for PayPal order tracking
CREATE TABLE IF NOT EXISTS pending_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  license_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);