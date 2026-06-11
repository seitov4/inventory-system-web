# POS Terminal Flow

## Overview

The POS page completes sales through `POST /api/sales`. The frontend never sends or edits `store_id`; the backend derives it from the authenticated user.

## Product Lookup

Endpoint:

```http
GET /api/products/lookup?query=4870000000162&warehouse_id=1
```

Rules:

- Uses `req.user.store_id`.
- Searches active products by exact barcode, exact SKU, product ID, or name `ILIKE`.
- Returns stock for the selected warehouse when `warehouse_id` is passed, otherwise aggregated across warehouses in the current store.
- Does not return products from other stores.

## Create Sale

Endpoint:

```http
POST /api/sales
```

Request:

```json
{
  "warehouse_id": 1,
  "payment_type": "CASH",
  "discount": 0,
  "items": [
    {
      "product_id": 123,
      "qty": 2
    }
  ]
}
```

Backend-derived fields:

- `store_id = req.user.store_id`
- `cashier_id = req.user.id`
- `status = completed`
- item prices from `products.sale_price`
- `total_amount` from DB product prices and discounts

## Validation

The backend validates:

- authenticated user has a store
- `warehouse_id` belongs to the current store
- each product belongs to the current store and is active
- each quantity is a positive integer
- stock is sufficient in the selected warehouse
- `payment_type` is one of `CASH`, `CARD`, `KASPI`
- discount is non-negative and does not exceed subtotal

## Transaction Effects

For each successful sale:

- one `sales` row is inserted with `status = completed`
- `sale_items` rows are inserted
- stock is decremented through `applyMovement`
- one `movements` row is created per item
- transaction commits only if every step succeeds

Movement convention:

- `direction = 1` for stock-in style movements: `IN`, `RETURN`, `ADJUST`, `TRANSFER`
- `direction = -1` for stock-out style movements: `OUT`, `SALE`
- `source_type = 'SALE'` for POS sales

## Frontend Behavior

The POS frontend:

- looks up products via `/api/products/lookup`
- stores cart rows as `product_id`, `name`, `sku`, `barcode`, `qty`, `price`, `stock`
- merges repeated scans into one cart row
- prevents quantity from exceeding available stock
- hides Store ID completely
- keeps Warehouse, Payment type, Discount, Total, and Pay controls visible
- clears the cart, barcode input, and discount after a successful payment

## Manual PowerShell Checks

Login:

```powershell
$login = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"owner@test.local","password":"test123"}'

$token = $login.data.token
```

Product lookup:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/products/lookup?query=4870000000162&warehouse_id=1" `
  -Headers @{ Authorization = "Bearer $token" }
```

Create sale:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/sales" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "warehouse_id": 1,
    "payment_type": "CASH",
    "discount": 0,
    "items": [
      {
        "product_id": 1,
        "qty": 1
      }
    ]
  }'
```

Database checks:

```sql
SELECT created_at::date, COUNT(*), SUM(total_amount)
FROM sales
WHERE status = 'completed'
GROUP BY created_at::date
ORDER BY created_at::date DESC
LIMIT 5;

SELECT COUNT(*) FROM sale_items;

SELECT direction, source_type, COUNT(*)
FROM movements
GROUP BY direction, source_type
ORDER BY direction, source_type;
```
